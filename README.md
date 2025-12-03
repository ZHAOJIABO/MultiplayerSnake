# 多人在线贪吃蛇游戏

一个基于Go和WebSocket的多人实时在线贪吃蛇游戏。

## 游戏特色

- 🎮 多人实时在线对战
- 🐍 长蛇吃短蛇机制
- 🎯 可以吃掉自己的尾部
- 📱 支持PC和移动设备
- 🎨 彩色蛇身，区分不同玩家
- 🏆 实时排行榜
- 💀 死亡提示和击杀信息

## 游戏规则

1. **长蛇吃短蛇**：当两条蛇碰撞时，长度更长的蛇会吃掉短的蛇
2. **吃掉自己**：蛇头碰到自己的身体时，会从碰撞点切断，尾部长度转化为分数
3. **吃食物**：吃到食物会增加长度和分数
4. **撞墙死亡**：撞到墙壁会死亡
5. **随时加入**：任何玩家可以随时加入或重新开始

## 技术栈

- **后端**: Go + Gorilla WebSocket
- **前端**: HTML5 Canvas + 原生JavaScript
- **通信**: WebSocket实时双向通信
- **架构**: 无需数据库，所有状态存储在内存中

## 安装和运行

### 前置要求

- Go 1.16 或更高版本

### 安装步骤

1. 克隆仓库：
```bash
git clone https://github.com/你的用户名/MultiplayerSnake.git
cd MultiplayerSnake
```

2. 安装依赖：
```bash
go mod download
```

3. 编译并运行：
```bash
go build -o snake-server
./snake-server
```

或者直接运行：
```bash
go run main.go
```

4. 打开浏览器访问：
```
http://localhost:8080
```

## 控制方式

- **键盘**: WASD 或 方向键
- **屏幕按钮**: 点击屏幕上的方向按钮（适合移动设备）

## 项目结构

```
MultiplayerSnake/
├── main.go              # 主入口
├── game/                # 游戏逻辑
│   ├── types.go        # 数据类型定义
│   ├── snake.go        # 蛇的逻辑
│   ├── food.go         # 食物生成逻辑
│   └── game.go         # 游戏主循环
├── server/              # 服务器
│   ├── hub.go          # WebSocket连接池管理
│   ├── client.go       # 客户端连接管理
│   └── server.go       # HTTP和WebSocket服务器
└── static/              # 前端资源
    ├── index.html      # 游戏页面
    ├── style.css       # 样式
    └── game.js         # 前端游戏逻辑
```

## 配置

游戏参数可在 `game/game.go` 中修改：

- `GridWidth` / `GridHeight`: 游戏场地大小（默认 50x50）
- `MaxFoods`: 场上最大食物数量（默认 10）
- `TickRate`: 游戏更新频率（默认 100ms，即10帧/秒）

服务器端口可在 `main.go` 中修改（默认 :8080）。

## 服务器要求

### 最小配置（50-100人）
- CPU: 1核
- 内存: 2GB
- 带宽: 5-10Mbps

### 推荐配置（200-500人）
- CPU: 2核
- 内存: 4GB
- 带宽: 20-50Mbps

## 开发

### 添加新功能

1. 后端逻辑在 `game/` 目录中修改
2. 前端UI在 `static/` 目录中修改
3. 修改后重新编译即可

### 调试

查看服务器日志可以了解玩家连接和游戏状态。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

由 Claude Code 协助开发
