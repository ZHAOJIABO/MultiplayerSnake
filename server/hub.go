package server

import (
	"multiplayersnake/game"
)

// Hub 管理所有WebSocket连接
type Hub struct {
	// 注册的客户端
	clients map[*Client]bool

	// 广播消息通道
	broadcast chan []byte

	// 注册客户端通道
	register chan *Client

	// 注销客户端通道
	unregister chan *Client

	// 游戏实例
	game *game.Game
}

// NewHub 创建新的Hub
func NewHub() *Hub {
	broadcastCh := make(chan []byte, 256)

	hub := &Hub{
		broadcast:  broadcastCh,
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		game:       game.NewGame(broadcastCh),
	}

	return hub
}

// Run 启动Hub
func (h *Hub) Run() {
	// 启动游戏循环
	go h.game.Start()

	// 处理客户端注册、注销和广播
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				// 从游戏中移除玩家
				h.game.RemovePlayer(client.id)
			}

		case message := <-h.broadcast:
			// 向所有客户端广播消息
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					// 如果发送失败，关闭客户端
					close(client.send)
					delete(h.clients, client)
					h.game.RemovePlayer(client.id)
				}
			}
		}
	}
}
