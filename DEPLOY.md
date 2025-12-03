# 服务器部署指南

本文档详细说明如何将多人在线贪吃蛇游戏部署到服务器。

## 方案一：直接部署（推荐新手）

### 1. 服务器环境准备

#### 系统要求
- Linux服务器（Ubuntu 20.04+ / CentOS 7+ / Debian 10+）
- 至少 1GB 内存
- Go 1.16 或更高版本

#### 安装Go环境

**Ubuntu/Debian:**
```bash
# 下载Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz

# 解压到/usr/local
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 验证安装
go version
```

**CentOS/RHEL:**
```bash
# 下载Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz

# 解压
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bash_profile
source ~/.bash_profile

# 验证
go version
```

### 2. 上传代码到服务器

**方法1：使用Git（推荐）**
```bash
# 在服务器上克隆仓库
cd /opt
sudo git clone https://github.com/ZHAOJIABO/MultiplayerSnake.git
cd MultiplayerSnake
```

**方法2：使用scp上传**
```bash
# 在本地电脑打包
cd /Users/zhaojiabo/Documents/trae_projects
tar -czf MultiplayerSnake.tar.gz MultiplayerSnake/

# 上传到服务器
scp MultiplayerSnake.tar.gz user@your-server-ip:/opt/

# 在服务器上解压
ssh user@your-server-ip
cd /opt
tar -xzf MultiplayerSnake.tar.gz
cd MultiplayerSnake
```

### 3. 编译和运行

```bash
# 安装依赖
go mod download

# 编译
go build -o snake-server

# 直接运行（前台）
./snake-server
```

访问 `http://你的服务器IP:8080` 测试是否正常运行。

### 4. 配置防火墙

**Ubuntu/Debian (ufw):**
```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

## 方案二：使用Systemd后台运行（推荐生产环境）

### 1. 创建systemd服务文件

```bash
sudo nano /etc/systemd/system/snake-game.service
```

添加以下内容：
```ini
[Unit]
Description=Multiplayer Snake Game Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/MultiplayerSnake
ExecStart=/opt/MultiplayerSnake/snake-server
Restart=always
RestartSec=5

# 日志
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 2. 启动服务

```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start snake-game

# 设置开机自启动
sudo systemctl enable snake-game

# 查看服务状态
sudo systemctl status snake-game

# 查看日志
sudo journalctl -u snake-game -f
```

### 3. 管理服务

```bash
# 停止服务
sudo systemctl stop snake-game

# 重启服务
sudo systemctl restart snake-game

# 禁用开机自启
sudo systemctl disable snake-game
```

## 方案三：使用Nginx反向代理（推荐）

### 优势
- 可以使用80端口（无需在URL中加:8080）
- 支持SSL/HTTPS
- 更好的性能和安全性

### 1. 安装Nginx

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
```

**CentOS/RHEL:**
```bash
sudo yum install nginx
```

### 2. 配置Nginx

创建配置文件：
```bash
sudo nano /etc/nginx/sites-available/snake-game
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持
        proxy_read_timeout 86400;
    }
}
```

### 3. 启用配置

**Ubuntu/Debian:**
```bash
sudo ln -s /etc/nginx/sites-available/snake-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**CentOS/RHEL:**
```bash
sudo cp /etc/nginx/sites-available/snake-game /etc/nginx/conf.d/snake-game.conf
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置防火墙

```bash
# 允许HTTP
sudo ufw allow 80/tcp
# 或
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

现在可以通过 `http://your-domain.com` 访问游戏！

## 方案四：配置HTTPS（可选但推荐）

### 使用Let's Encrypt免费SSL证书

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx
# 或
sudo yum install certbot python3-certbot-nginx

# 获取证书并自动配置Nginx
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

## 方案五：使用Docker部署（推荐容器化）

### 1. 创建Dockerfile

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o snake-server

FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /app/snake-server .
COPY --from=builder /app/static ./static

EXPOSE 8080
CMD ["./snake-server"]
```

### 2. 创建docker-compose.yml

```yaml
version: '3.8'

services:
  snake-game:
    build: .
    ports:
      - "8080:8080"
    restart: always
    environment:
      - TZ=Asia/Shanghai
```

### 3. 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 性能优化建议

### 1. 修改端口（可选）

如果要修改默认端口8080，编辑 `main.go`：
```go
func main() {
    srv := server.NewServer(":3000")  // 改为你想要的端口
    log.Fatal(srv.Start())
}
```

重新编译：
```bash
go build -o snake-server
```

### 2. 监控和日志

```bash
# 查看实时日志
sudo journalctl -u snake-game -f

# 查看最近100行日志
sudo journalctl -u snake-game -n 100

# 按时间查看日志
sudo journalctl -u snake-game --since "2024-01-01"
```

### 3. 资源限制（可选）

在systemd服务文件中添加：
```ini
[Service]
MemoryLimit=512M
CPUQuota=50%
```

## 更新部署

当代码有更新时：

```bash
# 进入项目目录
cd /opt/MultiplayerSnake

# 拉取最新代码
sudo git pull

# 重新编译
go build -o snake-server

# 重启服务
sudo systemctl restart snake-game
```

## 故障排查

### 1. 查看服务状态
```bash
sudo systemctl status snake-game
```

### 2. 查看详细日志
```bash
sudo journalctl -u snake-game -xe
```

### 3. 检查端口占用
```bash
sudo netstat -tlnp | grep 8080
# 或
sudo ss -tlnp | grep 8080
```

### 4. 测试WebSocket连接
```bash
# 安装wscat
npm install -g wscat

# 测试连接
wscat -c ws://localhost:8080/ws
```

## 安全建议

1. **使用非root用户运行**
2. **配置防火墙，只开放必要端口**
3. **使用HTTPS加密连接**
4. **定期更新系统和依赖**
5. **配置日志轮转**

```bash
# 创建日志轮转配置
sudo nano /etc/logrotate.d/snake-game
```

添加：
```
/var/log/snake-game/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 your-username your-username
}
```

## 备份建议

```bash
# 创建备份脚本
sudo nano /opt/backup-snake-game.sh
```

添加：
```bash
#!/bin/bash
BACKUP_DIR="/backup/snake-game"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/snake-game-$DATE.tar.gz /opt/MultiplayerSnake

# 保留最近7天的备份
find $BACKUP_DIR -name "snake-game-*.tar.gz" -mtime +7 -delete
```

设置定时任务：
```bash
sudo crontab -e
# 添加每天凌晨2点备份
0 2 * * * /opt/backup-snake-game.sh
```

## 常见问题

**Q: 如何修改游戏参数？**
A: 编辑 `game/game.go`，修改常量后重新编译。

**Q: 支持多少人同时在线？**
A: 取决于服务器配置，1核2G服务器建议50-100人。

**Q: 如何查看在线人数？**
A: 查看日志中的连接信息，或添加监控页面。

**Q: WebSocket连接失败？**
A: 检查防火墙、Nginx配置的WebSocket支持。

## 获取帮助

- GitHub Issues: https://github.com/ZHAOJIABO/MultiplayerSnake/issues
- 查看日志: `sudo journalctl -u snake-game -f`
