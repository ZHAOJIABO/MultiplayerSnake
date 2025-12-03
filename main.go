package main

import (
	"log"
	"multiplayersnake/server"
)

func main() {
	// 创建并启动服务器
	srv := server.NewServer(":8080")
	log.Fatal(srv.Start())
}
