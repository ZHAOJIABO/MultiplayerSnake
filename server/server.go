package server

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源（生产环境应该更严格）
	},
}

// Server 表示HTTP服务器
type Server struct {
	hub  *Hub
	addr string
}

// NewServer 创建新服务器
func NewServer(addr string) *Server {
	return &Server{
		hub:  NewHub(),
		addr: addr,
	}
}

// Start 启动服务器
func (s *Server) Start() error {
	// 启动Hub
	go s.hub.Run()

	// 设置路由
	http.HandleFunc("/ws", s.handleWebSocket)
	http.Handle("/", http.FileServer(http.Dir("./static")))

	log.Printf("Server starting on %s", s.addr)
	return http.ListenAndServe(s.addr, nil)
}

// handleWebSocket 处理WebSocket连接
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := NewClient(s.hub, conn)
	s.hub.register <- client

	// 启动读写goroutines
	go client.writePump()
	go client.readPump()
}
