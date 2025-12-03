#!/bin/bash

###############################################################################
# 多人贪吃蛇游戏自动部署脚本
# 域名: snake.appbobo.com
# 端口: 8080
# 项目: https://github.com/ZHAOJIABO/MultiplayerSnake
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="snake.appbobo.com"
PROJECT_DIR="/opt/snake-game"
SERVICE_NAME="snake-game"
PORT="8080"
GITHUB_REPO="https://github.com/ZHAOJIABO/MultiplayerSnake.git"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root用户运行此脚本，或使用 sudo"
        exit 1
    fi
}

# 检查Go环境
check_go() {
    log_info "检查Go环境..."
    if ! command -v go &> /dev/null; then
        log_error "Go未安装！"
        echo ""
        echo "请先安装Go:"
        echo "wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz"
        echo "tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz"
        echo "export PATH=\$PATH:/usr/local/go/bin"
        exit 1
    fi
    GO_VERSION=$(go version)
    log_success "Go已安装: $GO_VERSION"
}

# 检查Nginx
check_nginx() {
    log_info "检查Nginx..."
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx未安装！"
        echo ""
        read -p "是否现在安装Nginx? (y/n): " install_nginx
        if [ "$install_nginx" = "y" ]; then
            apt-get update
            apt-get install -y nginx
            log_success "Nginx安装完成"
        else
            exit 1
        fi
    else
        log_success "Nginx已安装"
    fi
}

# 检查端口占用
check_port() {
    log_info "检查端口 $PORT 是否被占用..."
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        log_warn "端口 $PORT 已被占用！"
        lsof -Pi :$PORT -sTCP:LISTEN
        echo ""
        read -p "是否继续？这可能会导致端口冲突 (y/n): " continue_anyway
        if [ "$continue_anyway" != "y" ]; then
            exit 1
        fi
    else
        log_success "端口 $PORT 可用"
    fi
}

# 停止旧服务（如果存在）
stop_old_service() {
    if systemctl is-active --quiet $SERVICE_NAME; then
        log_info "停止旧服务..."
        systemctl stop $SERVICE_NAME
        log_success "旧服务已停止"
    fi
}

# 克隆或更新代码
setup_code() {
    log_info "设置项目代码..."

    if [ -d "$PROJECT_DIR" ]; then
        log_warn "项目目录已存在: $PROJECT_DIR"
        read -p "是否删除并重新克隆? (y/n): " recreate
        if [ "$recreate" = "y" ]; then
            rm -rf $PROJECT_DIR
            mkdir -p $PROJECT_DIR
            cd $PROJECT_DIR
            git clone $GITHUB_REPO .
        else
            cd $PROJECT_DIR
            git pull
        fi
    else
        mkdir -p $PROJECT_DIR
        cd $PROJECT_DIR
        git clone $GITHUB_REPO .
    fi

    log_success "代码准备完成"
}

# 编译项目
build_project() {
    log_info "编译项目..."
    cd $PROJECT_DIR

    # 下载依赖
    go mod download

    # 编译
    go build -o snake-server

    if [ ! -f "snake-server" ]; then
        log_error "编译失败！"
        exit 1
    fi

    chmod +x snake-server
    log_success "编译完成"
}

# 创建systemd服务
create_systemd_service() {
    log_info "创建systemd服务..."

    cat > /etc/systemd/system/$SERVICE_NAME.service <<EOF
[Unit]
Description=Multiplayer Snake Game Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/snake-server
Restart=always
RestartSec=5

StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    log_success "Systemd服务创建完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."

    # 创建Nginx配置
    cat > /etc/nginx/sites-available/$DOMAIN <<EOF
# $DOMAIN 配置
server {
    listen 80;
    server_name $DOMAIN;

    access_log /var/log/nginx/snake.access.log;
    error_log /var/log/nginx/snake.error.log;

    location / {
        proxy_pass http://localhost:$PORT;

        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # 传递真实IP
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket超时
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;

        # 缓冲
        proxy_buffering off;
    }
}
EOF

    # 创建软链接
    if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
        ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    fi

    # 测试Nginx配置
    if nginx -t; then
        log_success "Nginx配置正确"
    else
        log_error "Nginx配置错误！"
        exit 1
    fi

    # 重新加载Nginx
    systemctl reload nginx
    log_success "Nginx配置完成并已重新加载"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."

    # 检查ufw
    if command -v ufw &> /dev/null; then
        ufw allow 80/tcp >/dev/null 2>&1 || true
        log_success "防火墙规则已添加 (ufw)"
    fi

    # 检查firewalld
    if command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
        firewall-cmd --reload >/dev/null 2>&1 || true
        log_success "防火墙规则已添加 (firewalld)"
    fi
}

# 启动服务
start_service() {
    log_info "启动服务..."

    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME

    # 等待服务启动
    sleep 2

    if systemctl is-active --quiet $SERVICE_NAME; then
        log_success "服务启动成功！"
    else
        log_error "服务启动失败！"
        echo ""
        echo "查看日志："
        echo "sudo journalctl -u $SERVICE_NAME -n 50"
        exit 1
    fi
}

# 配置SSL
configure_ssl() {
    log_info "配置SSL证书..."

    if ! command -v certbot &> /dev/null; then
        log_warn "Certbot未安装"
        read -p "是否安装Certbot并配置HTTPS? (y/n): " install_certbot
        if [ "$install_certbot" = "y" ]; then
            apt-get update
            apt-get install -y certbot python3-certbot-nginx
        else
            log_warn "跳过SSL配置"
            return
        fi
    fi

    read -p "是否现在配置HTTPS? (y/n): " setup_ssl
    if [ "$setup_ssl" = "y" ]; then
        certbot --nginx -d $DOMAIN
        log_success "SSL证书配置完成"
    else
        log_warn "跳过SSL配置，稍后可运行: sudo certbot --nginx -d $DOMAIN"
    fi
}

# 显示状态
show_status() {
    echo ""
    echo "======================================"
    echo "         部署完成！"
    echo "======================================"
    echo ""
    echo "项目信息："
    echo "  域名: $DOMAIN"
    echo "  目录: $PROJECT_DIR"
    echo "  端口: $PORT"
    echo "  服务: $SERVICE_NAME"
    echo ""
    echo "访问地址："
    echo "  HTTP:  http://$DOMAIN"
    echo "  HTTPS: https://$DOMAIN (如已配置SSL)"
    echo ""
    echo "常用命令："
    echo "  查看状态: sudo systemctl status $SERVICE_NAME"
    echo "  重启服务: sudo systemctl restart $SERVICE_NAME"
    echo "  查看日志: sudo journalctl -u $SERVICE_NAME -f"
    echo "  停止服务: sudo systemctl stop $SERVICE_NAME"
    echo ""
    echo "服务状态："
    systemctl status $SERVICE_NAME --no-pager -l
    echo ""
}

# 主函数
main() {
    echo "======================================"
    echo "  多人贪吃蛇游戏 - 自动部署脚本"
    echo "======================================"
    echo ""

    check_root
    check_go
    check_nginx
    check_port

    echo ""
    read -p "是否继续部署到 $DOMAIN ? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        log_warn "部署已取消"
        exit 0
    fi

    echo ""
    stop_old_service
    setup_code
    build_project
    create_systemd_service
    configure_nginx
    configure_firewall
    start_service

    echo ""
    read -p "是否配置HTTPS/SSL? (y/n): " ssl_choice
    if [ "$ssl_choice" = "y" ]; then
        configure_ssl
    fi

    show_status
}

# 运行主函数
main
