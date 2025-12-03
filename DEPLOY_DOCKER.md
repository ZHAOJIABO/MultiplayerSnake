# Docker 部署指南

本指南介绍如何使用Docker和Docker Compose部署多人贪吃蛇游戏。

## 优势

- ✅ 环境隔离，不污染宿主机
- ✅ 一键部署，无需手动安装Go环境
- ✅ 跨平台支持（Linux、macOS、Windows）
- ✅ 易于管理和更新
- ✅ 资源限制，防止占用过多资源

## 前置要求

### 安装Docker和Docker Compose

**Ubuntu/Debian:**
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到docker组（可选，避免每次使用sudo）
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

**CentOS/RHEL:**
```bash
# 安装Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证
docker --version
docker compose version
```

## 快速部署（推荐）

### 方法1：使用docker-compose（最简单）

```bash
# 1. 克隆项目
git clone https://github.com/ZHAOJIABO/MultiplayerSnake.git
cd MultiplayerSnake

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

就这么简单！访问 `http://your-server-ip:8080` 即可玩游戏。

### 方法2：使用Docker命令

```bash
# 1. 克隆项目
git clone https://github.com/ZHAOJIABO/MultiplayerSnake.git
cd MultiplayerSnake

# 2. 构建镜像
docker build -t snake-game:latest .

# 3. 运行容器
docker run -d \
  --name snake-game \
  -p 8080:8080 \
  --restart always \
  snake-game:latest

# 4. 查看日志
docker logs -f snake-game
```

## 与Nginx结合使用

### 配置Nginx反向代理

创建Nginx配置文件：
```bash
sudo nano /etc/nginx/sites-available/snake.appbobo.com
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name snake.appbobo.com;

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

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/snake.appbobo.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 配置HTTPS

```bash
# 安装certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d snake.appbobo.com

# 测试自动续期
sudo certbot renew --dry-run
```

## 使用docker-compose with Nginx

创建完整的 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  snake-game:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: snake-game
    restart: always
    environment:
      - TZ=Asia/Shanghai
    networks:
      - snake-network

  nginx:
    image: nginx:alpine
    container_name: snake-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - snake-game
    restart: always
    networks:
      - snake-network

networks:
  snake-network:
    driver: bridge
```

## 管理命令

### docker-compose方式

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps

# 重新构建并启动
docker-compose up -d --build

# 进入容器
docker-compose exec snake-game sh
```

### Docker命令方式

```bash
# 查看所有容器
docker ps -a

# 查看日志
docker logs -f snake-game

# 停止容器
docker stop snake-game

# 启动容器
docker start snake-game

# 重启容器
docker restart snake-game

# 删除容器
docker rm -f snake-game

# 查看镜像
docker images

# 删除镜像
docker rmi snake-game:latest

# 进入容器
docker exec -it snake-game sh

# 查看容器资源使用
docker stats snake-game
```

## 更新部署

当代码有更新时：

```bash
# 1. 拉取最新代码
cd MultiplayerSnake
git pull

# 2. 重新构建并启动
docker-compose up -d --build

# 或使用Docker命令
docker build -t snake-game:latest .
docker stop snake-game
docker rm snake-game
docker run -d --name snake-game -p 8080:8080 --restart always snake-game:latest
```

## 配置选项

### 修改端口

编辑 `docker-compose.yml`：
```yaml
services:
  snake-game:
    ports:
      - "3000:8080"  # 改为其他端口
```

### 资源限制

编辑 `docker-compose.yml`：
```yaml
services:
  snake-game:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # 最多使用2个CPU核心
          memory: 1G       # 最多使用1GB内存
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 持久化日志

```yaml
services:
  snake-game:
    volumes:
      - ./logs:/var/log/snake
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
```

## 故障排查

### 1. 查看容器状态

```bash
docker ps -a
docker-compose ps
```

### 2. 查看详细日志

```bash
# docker-compose
docker-compose logs --tail=100 snake-game

# Docker命令
docker logs --tail=100 snake-game
```

### 3. 检查端口占用

```bash
sudo netstat -tlnp | grep 8080
# 或
sudo ss -tlnp | grep 8080
```

### 4. 进入容器调试

```bash
docker exec -it snake-game sh

# 在容器内
ps aux
netstat -tlnp
wget http://localhost:8080
```

### 5. 重新构建镜像

```bash
# 清理旧镜像
docker-compose down
docker rmi snake-game:latest

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 6. 查看容器健康状态

```bash
docker inspect --format='{{.State.Health.Status}}' snake-game
```

## 性能优化

### 1. 使用多阶段构建

Dockerfile已经使用了多阶段构建，最终镜像大小约15MB。

### 2. 限制日志大小

在 `docker-compose.yml` 中配置：
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. 使用host网络模式（生产环境可选）

```yaml
services:
  snake-game:
    network_mode: "host"
```

注意：使用host模式时，容器直接使用宿主机网络，无需端口映射。

## 安全建议

1. **使用非root用户运行** ✅（Dockerfile已配置）
2. **限制资源使用** ✅（docker-compose.yml已配置）
3. **配置HTTPS**
4. **定期更新镜像**
   ```bash
   docker pull alpine:latest
   docker-compose build --no-cache
   ```
5. **启用防火墙**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

## 备份和恢复

### 导出镜像

```bash
docker save -o snake-game.tar snake-game:latest
```

### 导入镜像

```bash
docker load -i snake-game.tar
```

### 备份容器数据

```bash
docker export snake-game > snake-game-backup.tar
```

## 监控

### 查看实时资源使用

```bash
docker stats snake-game
```

### 使用Portainer（可选）

```bash
docker volume create portainer_data
docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

访问 `http://your-server-ip:9000` 使用Web界面管理Docker。

## 卸载

### 完全卸载

```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker rmi snake-game:latest

# 删除项目目录
cd ..
rm -rf MultiplayerSnake

# 删除Nginx配置（如果配置了）
sudo rm /etc/nginx/sites-enabled/snake.appbobo.com
sudo rm /etc/nginx/sites-available/snake.appbobo.com
sudo systemctl reload nginx
```

## 常见问题

**Q: Docker镜像太大怎么办？**
A: 使用alpine基础镜像和多阶段构建，镜像已经很小了（约15MB）。

**Q: 如何查看游戏服务器日志？**
A: `docker-compose logs -f snake-game`

**Q: 容器启动失败？**
A: 检查端口是否被占用，查看详细日志 `docker-compose logs`

**Q: 如何自动重启容器？**
A: 在docker-compose.yml中已配置 `restart: always`

**Q: 如何修改游戏配置？**
A: 修改源代码后重新构建：`docker-compose up -d --build`

## 获取帮助

- 查看Docker日志: `docker-compose logs -f`
- GitHub Issues: https://github.com/ZHAOJIABO/MultiplayerSnake/issues
- Docker官方文档: https://docs.docker.com
