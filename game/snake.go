package game

import (
	"math/rand"
)

// Snake 表示一条蛇
type Snake struct {
	ID            string
	Name          string
	Body          []Point
	Direction     Direction
	Color         string
	Score         int
	Alive         bool
	NextDirection Direction // 用于存储下一个方向，避免在一帧内多次改变方向
	DeathReason   string    // 死亡原因
	KillerName    string    // 谁杀死的
}

// 预定义的颜色列表
var colors = []string{
	"#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
	"#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B195", "#C06C84",
	"#6C5B7B", "#F67280", "#355C7D", "#99B898", "#FECEAB",
}

// NewSnake 创建一条新蛇
func NewSnake(id, name string, gridWidth, gridHeight int) *Snake {
	// 随机生成初始位置
	x := rand.Intn(gridWidth-10) + 5
	y := rand.Intn(gridHeight-10) + 5

	// 初始蛇身长度为3
	body := []Point{
		{X: x, Y: y},
		{X: x, Y: y + 1},
		{X: x, Y: y + 2},
	}

	// 随机选择颜色
	color := colors[rand.Intn(len(colors))]

	// 随机初始方向
	directions := []Direction{Up, Down, Left, Right}
	direction := directions[rand.Intn(len(directions))]

	return &Snake{
		ID:            id,
		Name:          name,
		Body:          body,
		Direction:     direction,
		NextDirection: direction,
		Color:         color,
		Score:         0,
		Alive:         true,
	}
}

// SetDirection 设置蛇的移动方向（不允许反向）
func (s *Snake) SetDirection(dir Direction) {
	// 防止反向移动
	if s.Direction == Up && dir == Down {
		return
	}
	if s.Direction == Down && dir == Up {
		return
	}
	if s.Direction == Left && dir == Right {
		return
	}
	if s.Direction == Right && dir == Left {
		return
	}
	s.NextDirection = dir
}

// Move 移动蛇
func (s *Snake) Move() {
	if !s.Alive {
		return
	}

	// 应用下一个方向
	s.Direction = s.NextDirection

	// 计算新的头部位置
	head := s.Body[0]
	var newHead Point

	switch s.Direction {
	case Up:
		newHead = Point{X: head.X, Y: head.Y - 1}
	case Down:
		newHead = Point{X: head.X, Y: head.Y + 1}
	case Left:
		newHead = Point{X: head.X - 1, Y: head.Y}
	case Right:
		newHead = Point{X: head.X + 1, Y: head.Y}
	}

	// 将新头部添加到身体前面
	s.Body = append([]Point{newHead}, s.Body...)
}

// RemoveTail 移除尾部（正常移动时调用）
func (s *Snake) RemoveTail() {
	if len(s.Body) > 0 {
		s.Body = s.Body[:len(s.Body)-1]
	}
}

// Grow 让蛇增长（吃到食物时调用）
func (s *Snake) Grow() {
	s.Score++
	// 不移除尾部，蛇就会增长
}

// GetHead 获取蛇头位置
func (s *Snake) GetHead() Point {
	if len(s.Body) > 0 {
		return s.Body[0]
	}
	return Point{X: -1, Y: -1}
}

// Die 蛇死亡
func (s *Snake) Die() {
	s.Alive = false
}

// ToPlayerState 转换为PlayerState用于传输
func (s *Snake) ToPlayerState() *PlayerState {
	return &PlayerState{
		ID:          s.ID,
		Name:        s.Name,
		Snake:       s.Body,
		Color:       s.Color,
		Score:       s.Score,
		Alive:       s.Alive,
		DeathReason: s.DeathReason,
		KillerName:  s.KillerName,
	}
}
