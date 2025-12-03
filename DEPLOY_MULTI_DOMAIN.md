# 多域名部署指南 - snake.appbobo.com

本指南针对已有项目运行的服务器，添加第二个项目的部署方案。

## 前提条件

- 已有项目运行在 polish.appbobo.com
- 服务器已安装Nginx
- 需要部署贪吃蛇游戏到 snake.appbobo.com

## 部署步骤

### 步骤1：配置DNS解析

首先在你的域名管理后台（如阿里云、腾讯云等）添加A记录：

```
类型: A
主机记录: snake
记录值: 你的服务器IP
TTL: 600
```

验证DNS解析（可能需要等待几分钟）：
```bash
ping snake.appbobo.com
```

### 步骤2：上传代码到服务器

```bash
# SSH登录服务器
ssh your-username@your-server-ip

# 创建项目目录
sudo mkdir -p /opt/snake-game
cd /opt/snake-game

# 克隆代码
sudo git clone https://github.com/ZHAOJIABO/MultiplayerSnake.git .

# 或者从本地上传（在本地执行）
cd /Users/zhaojiabo/Documents/trae_projects
tar -czf MultiplayerSnake.tar.gz MultiplayerSnake/
scp MultiplayerSnake.tar.gz your-username@your-server-ip:/tmp/
# 然后在服务器解压
ssh your-username@your-server-ip
sudo tar -xzf /tmp/MultiplayerSnake.tar.gz -C /opt/snake-game --strip-components=1
```

### 步骤3：编译项目

```bash
cd /opt/snake-game

# 安装依赖
go mod download

# 编译（使用不同的端口，避免与现有项目冲突）
go build -o snake-server

# 测试运行（确认能正常启动）
./snake-server
# 按Ctrl+C停止
```

### 步骤4：配置Systemd服务

创建systemd服务文件：

```bash
sudo nano /etc/systemd/system/snake-game.service
```

添加以下内容（注意：使用8080端口，与现有项目区分）：

```ini
[Unit]
Description=Multiplayer Snake Game Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/snake-game
ExecStart=/opt/snake-game/snake-server
Restart=always
RestartSec=5

# 环境变量（可选）
Environment="PORT=8080"

# 日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=snake-game

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重新加载systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start snake-game

# 设置开机自启
sudo systemctl enable snake-game

# 查看状态
sudo systemctl status snake-game

# 查看日志
sudo journalctl -u snake-game -f
```

### 步骤5：配置Nginx虚拟主机

创建新的Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/snake.appbobo.com
```

添加以下配置：

```nginx
# snake.appbobo.com 配置
server {
    listen 80;
    server_name snake.appbobo.com;

    # 日志
    access_log /var/log/nginx/snake.access.log;
    error_log /var/log/nginx/snake.error.log;

    location / {
        # 反向代理到8080端口
        proxy_pass http://localhost:8080;

        # WebSocket支持（重要！）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 传递真实IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket超时设置
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;

        # 缓冲设置
        proxy_buffering off;
    }
}
```

### 步骤6：启用Nginx配置

```bash
# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/snake.appbobo.com /etc/nginx/sites-enabled/

# 测试Nginx配置
sudo nginx -t

# 如果配置正确，重启Nginx
sudo systemctl reload nginx
```

### 步骤7：配置防火墙（如果需要）

```bash
# 确保8080端口在防火墙中开放（但不直接对外暴露，只允许本地访问）
# Ubuntu/Debian
sudo ufw status
# 如果8080端口已对外开放，可以考虑限制只允许本地访问

# 确保80端口对外开放
sudo ufw allow 80/tcp
```

### 步骤8：配置HTTPS（强烈推荐）

使用Let's Encrypt免费SSL证书：

```bash
# 确保已安装certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 为snake.appbobo.com申请证书
sudo certbot --nginx -d snake.appbobo.com

# 选择：
# 1. 输入邮箱
# 2. 同意服务条款
# 3. 选择是否接收邮件
# 4. 选择重定向HTTP到HTTPS（推荐选择2）
```

Certbot会自动修改Nginx配置，添加HTTPS支持。

### 步骤9：验证部署

测试HTTP访问：
```bash
curl http://snake.appbobo.com
```

测试HTTPS访问：
```bash
curl https://snake.appbobo.com
```

在浏览器访问：
- HTTP: http://snake.appbobo.com
- HTTPS: https://snake.appbobo.com

### 步骤10：检查WebSocket连接

打开浏览器开发者工具（F12），访问游戏页面，在Console中检查是否有WebSocket连接错误。

## 最终的服务器配置架构

```
服务器架构：
┌─────────────────────────────────────┐
│         Nginx (80/443端口)          │
├─────────────────────────────────────┤
│  polish.appbobo.com → 原有项目端口  │
│  snake.appbobo.com  → :8080         │
└─────────────────────────────────────┘
             ↓           ↓
     ┌───────────┐  ┌──────────────┐
     │ 原有项目  │  │ snake-server │
     │           │  │  (端口8080)  │
     └───────────┘  └──────────────┘
```

## 完整的Nginx配置示例

如果你的原有项目也在Nginx下，最终应该有两个配置文件：

1. `/etc/nginx/sites-available/polish.appbobo.com` - 原有项目
2. `/etc/nginx/sites-available/snake.appbobo.com` - 贪吃蛇游戏

## 常用管理命令

```bash
# 查看贪吃蛇服务状态
sudo systemctl status snake-game

# 重启贪吃蛇服务
sudo systemctl restart snake-game

# 查看日志
sudo journalctl -u snake-game -f

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/snake.error.log

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/snake.access.log

# 重启Nginx
sudo systemctl restart nginx

# 测试Nginx配置
sudo nginx -t
```

## 端口占用检查

如果8080端口已被占用：

```bash
# 查看端口占用
sudo netstat -tlnp | grep 8080
# 或
sudo ss -tlnp | grep 8080

# 修改为其他端口，比如8081
# 1. 修改main.go中的端口
sudo nano /opt/snake-game/main.go
# 将 :8080 改为 :8081

# 2. 重新编译
cd /opt/snake-game
go build -o snake-server

# 3. 修改Nginx配置
sudo nano /etc/nginx/sites-available/snake.appbobo.com
# 将 proxy_pass http://localhost:8080; 改为 8081

# 4. 重启服务
sudo systemctl restart snake-game
sudo systemctl reload nginx
```

## 故障排查

### 问题1：无法访问 snake.appbobo.com

检查DNS解析：
```bash
nslookup snake.appbobo.com
```

检查Nginx配置：
```bash
sudo nginx -t
sudo systemctl status nginx
```

### 问题2：页面可以访问，但游戏无法连接

检查WebSocket连接：
1. 打开浏览器开发者工具（F12）
2. 查看Console是否有WebSocket错误
3. 检查Network标签的WS连接

检查服务是否运行：
```bash
sudo systemctl status snake-game
sudo journalctl -u snake-game -n 50
```

### 问题3：WebSocket连接被拒绝

确认Nginx配置包含WebSocket支持：
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

重启Nginx：
```bash
sudo systemctl restart nginx
```

### 问题4：HTTPS下WebSocket无法连接

如果使用HTTPS，确保WebSocket也使用WSS协议。检查前端代码会自动处理：
```javascript
// static/game.js 中会自动判断
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
```

## 更新部署

当代码有更新时：

```bash
# 1. 拉取最新代码
cd /opt/snake-game
sudo git pull

# 2. 重新编译
sudo go build -o snake-server

# 3. 重启服务
sudo systemctl restart snake-game

# 4. 查看状态
sudo systemctl status snake-game
```

## 性能优化

### 1. Nginx缓存静态文件

在Nginx配置中添加：
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    proxy_pass http://localhost:8080;
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

### 2. 启用Gzip压缩

在Nginx配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

## 监控和日志

### 设置日志轮转

```bash
sudo nano /etc/logrotate.d/snake-game
```

添加：
```
/var/log/nginx/snake.*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

## 安全建议

1. **限制端口访问**：确保8080端口只能本地访问
2. **使用HTTPS**：通过Let's Encrypt配置免费SSL
3. **定期更新**：保持系统和依赖包最新
4. **设置访问限制**：可以在Nginx中配置IP白名单（如果需要）

## 备份

创建自动备份脚本：
```bash
sudo nano /opt/backup-snake.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/snake-game"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/snake-game-$DATE.tar.gz /opt/snake-game

# 保留最近7天
find $BACKUP_DIR -name "snake-game-*.tar.gz" -mtime +7 -delete
```

设置权限并添加定时任务：
```bash
sudo chmod +x /opt/backup-snake.sh
sudo crontab -e
# 添加：每天凌晨3点备份
0 3 * * * /opt/backup-snake.sh
```

## 总结

部署完成后，你将有：
- ✅ polish.appbobo.com - 原有项目
- ✅ snake.appbobo.com - 贪吃蛇游戏
- ✅ 两个项目独立运行，互不干扰
- ✅ HTTPS加密访问
- ✅ 自动重启和日志管理

访问 https://snake.appbobo.com 开始游戏！
