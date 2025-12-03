package server

import (
	"encoding/json"
	"log"
	"multiplayersnake/game"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	// 写入等待时间
	writeWait = 10 * time.Second

	// Pong等待时间
	pongWait = 60 * time.Second

	// Ping周期（必须小于pongWait）
	pingPeriod = (pongWait * 9) / 10

	// 最大消息大小
	maxMessageSize = 512
)

// Client 表示一个WebSocket客户端
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
	id   string
	name string
}

// NewClient 创建新客户端
func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 256),
		id:   uuid.New().String(),
	}
}

// readPump 从WebSocket读取消息
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// 解析消息
		var msg game.Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("error unmarshaling message: %v", err)
			continue
		}

		// 处理不同类型的消息
		switch msg.Type {
		case "join":
			c.name = msg.PlayerName
			if c.name == "" {
				c.name = "Player"
			}
			// 在游戏中添加玩家
			c.hub.game.AddPlayer(c.id, c.name)
			log.Printf("Player %s joined with ID %s", c.name, c.id)

		case "direction":
			// 更新玩家方向
			c.hub.game.UpdatePlayerDirection(c.id, msg.Direction)
		}
	}
}

// writePump 向WebSocket写入消息
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub关闭了通道
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// 将队列中的其他消息也写入
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
