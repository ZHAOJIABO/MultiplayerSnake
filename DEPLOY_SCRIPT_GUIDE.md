# 一键部署脚本使用指南

## 快速开始

只需3步即可完成部署：

### 1. 上传脚本到服务器

**方法1：直接下载（推荐）**
```bash
# SSH登录服务器后执行
wget https://raw.githubusercontent.com/ZHAOJIABO/MultiplayerSnake/main/deploy.sh
chmod +x deploy.sh
```

**方法2：从本地上传**
```bash
# 在本地电脑执行
scp /Users/zhaojiabo/Documents/trae_projects/MultiplayerSnake/deploy.sh root@your-server-ip:/root/
```

### 2. 运行脚本

```bash
# SSH登录服务器
ssh root@your-server-ip

# 运行部署脚本
sudo bash deploy.sh
```

### 3. 按提示操作

脚本会自动：
- ✅ 检查环境（Go、Nginx等）
- ✅ 克隆代码
- ✅ 编译项目
- ✅ 创建systemd服务
- ✅ 配置Nginx
- ✅ 配置防火墙
- ✅ 启动服务
- ✅ （可选）配置HTTPS

## 脚本功能

### 自动检查
- Go环境是否安装
- Nginx是否安装（未安装会提示安装）
- 端口8080是否被占用
- Root权限

### 自动配置
- 项目克隆到 `/opt/snake-game`
- 创建systemd服务 `snake-game`
- 配置Nginx虚拟主机
- 开放防火墙端口
- 设置开机自启动

### 交互式选项
- 是否删除旧代码重新克隆
- 是否配置HTTPS/SSL
- 端口冲突时是否继续

## 运行示例

```bash
root@server:~# bash deploy.sh

======================================
  多人贪吃蛇游戏 - 自动部署脚本
======================================

[INFO] 检查Go环境...
[SUCCESS] Go已安装: go version go1.21.5 linux/amd64
[INFO] 检查Nginx...
[SUCCESS] Nginx已安装
[INFO] 检查端口 8080 是否被占用...
[SUCCESS] 端口 8080 可用

是否继续部署到 snake.appbobo.com ? (y/n): y

[INFO] 设置项目代码...
[SUCCESS] 代码准备完成
[INFO] 编译项目...
[SUCCESS] 编译完成
[INFO] 创建systemd服务...
[SUCCESS] Systemd服务创建完成
[INFO] 配置Nginx...
[SUCCESS] Nginx配置完成并已重新加载
[INFO] 配置防火墙...
[SUCCESS] 防火墙规则已添加
[INFO] 启动服务...
[SUCCESS] 服务启动成功！

是否配置HTTPS/SSL? (y/n): y
[INFO] 配置SSL证书...
[SUCCESS] SSL证书配置完成

======================================
         部署完成！
======================================

项目信息：
  域名: snake.appbobo.com
  目录: /opt/snake-game
  端口: 8080
  服务: snake-game

访问地址：
  HTTP:  http://snake.appbobo.com
  HTTPS: https://snake.appbobo.com

常用命令：
  查看状态: sudo systemctl status snake-game
  重启服务: sudo systemctl restart snake-game
  查看日志: sudo journalctl -u snake-game -f
  停止服务: sudo systemctl stop snake-game
```

## 前置要求

### 必须
- ✅ Linux服务器（Ubuntu/Debian/CentOS）
- ✅ Root权限
- ✅ 已安装Go 1.16+
- ✅ 域名 snake.appbobo.com 已解析到服务器IP

### 可选
- Nginx（脚本可自动安装）
- Certbot（配置HTTPS时需要）

## 故障排查

### 1. Go未安装

错误提示：
```
[ERROR] Go未安装！
```

解决方案：
```bash
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### 2. 端口被占用

错误提示：
```
[WARN] 端口 8080 已被占用！
```

解决方案：
```bash
# 查看占用进程
sudo lsof -i :8080

# 如需修改端口，编辑脚本中的PORT变量
nano deploy.sh
# 将 PORT="8080" 改为其他端口，如 PORT="8081"
```

### 3. Nginx配置错误

错误提示：
```
[ERROR] Nginx配置错误！
```

解决方案：
```bash
# 检查Nginx配置
sudo nginx -t

# 查看详细错误
sudo cat /var/log/nginx/error.log
```

### 4. 服务启动失败

错误提示：
```
[ERROR] 服务启动失败！
```

解决方案：
```bash
# 查看详细日志
sudo journalctl -u snake-game -n 50

# 检查编译是否成功
ls -lh /opt/snake-game/snake-server

# 手动测试运行
cd /opt/snake-game
./snake-server
```

### 5. DNS未解析

症状：浏览器无法访问域名

解决方案：
```bash
# 检查DNS解析
ping snake.appbobo.com

# 如未解析，去域名管理后台添加A记录
# 主机记录: snake
# 记录值: 你的服务器IP
```

## 手动安装Nginx

如果脚本无法自动安装Nginx：

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**CentOS/RHEL:**
```bash
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 手动配置HTTPS

如果跳过了SSL配置，稍后可以手动配置：

```bash
# 安装certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 配置SSL
sudo certbot --nginx -d snake.appbobo.com

# 测试自动续期
sudo certbot renew --dry-run
```

## 卸载

如需卸载项目：

```bash
# 停止并删除服务
sudo systemctl stop snake-game
sudo systemctl disable snake-game
sudo rm /etc/systemd/system/snake-game.service
sudo systemctl daemon-reload

# 删除项目目录
sudo rm -rf /opt/snake-game

# 删除Nginx配置
sudo rm /etc/nginx/sites-enabled/snake.appbobo.com
sudo rm /etc/nginx/sites-available/snake.appbobo.com
sudo systemctl reload nginx
```

## 更新项目

当代码有更新时，重新运行脚本即可：

```bash
sudo bash deploy.sh
```

脚本会自动拉取最新代码并重新编译。

## 常用管理命令

```bash
# 查看服务状态
sudo systemctl status snake-game

# 启动服务
sudo systemctl start snake-game

# 停止服务
sudo systemctl stop snake-game

# 重启服务
sudo systemctl restart snake-game

# 查看实时日志
sudo journalctl -u snake-game -f

# 查看最近100行日志
sudo journalctl -u snake-game -n 100

# 重新加载Nginx
sudo systemctl reload nginx

# 测试Nginx配置
sudo nginx -t
```

## 修改配置

### 修改端口

编辑脚本：
```bash
nano deploy.sh
# 修改 PORT="8080" 为其他端口
```

### 修改项目目录

编辑脚本：
```bash
nano deploy.sh
# 修改 PROJECT_DIR="/opt/snake-game" 为其他目录
```

### 修改域名

编辑脚本：
```bash
nano deploy.sh
# 修改 DOMAIN="snake.appbobo.com" 为你的域名
```

## 安全建议

1. ✅ 配置HTTPS（运行脚本时选择y）
2. ✅ 定期更新系统：`sudo apt update && sudo apt upgrade`
3. ✅ 配置防火墙规则
4. ✅ 定期查看日志：`sudo journalctl -u snake-game -f`
5. ✅ 设置定期备份

## 获取帮助

- 查看完整部署文档：[DEPLOY_MULTI_DOMAIN.md](DEPLOY_MULTI_DOMAIN.md)
- GitHub Issues: https://github.com/ZHAOJIABO/MultiplayerSnake/issues
- 查看系统日志：`sudo journalctl -u snake-game -n 100`
