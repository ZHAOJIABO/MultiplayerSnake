package game

// Point 表示游戏中的一个坐标点
type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Direction 表示移动方向
type Direction string

const (
	Up    Direction = "up"
	Down  Direction = "down"
	Left  Direction = "left"
	Right Direction = "right"
)

// Message 表示客户端发送的消息
type Message struct {
	Type      string    `json:"type"`
	PlayerName string   `json:"playerName,omitempty"`
	Direction Direction `json:"direction,omitempty"`
}

// GameState 表示游戏状态，用于广播给所有客户端
type GameState struct {
	Type       string         `json:"type"`
	Players    []*PlayerState `json:"players"`
	Foods      []Point        `json:"foods"`
	GridWidth  int            `json:"gridWidth"`
	GridHeight int            `json:"gridHeight"`
}

// PlayerState 表示单个玩家的状态
type PlayerState struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Snake       []Point `json:"snake"`
	Color       string  `json:"color"`
	Score       int     `json:"score"`
	Alive       bool    `json:"alive"`
	DeathReason string  `json:"deathReason,omitempty"` // 死亡原因
	KillerName  string  `json:"killerName,omitempty"`  // 谁杀死的
}

// KilledMessage 表示玩家被淘汰的消息
type KilledMessage struct {
	Type       string `json:"type"`
	Reason     string `json:"reason"`     // 淘汰原因：wall, eaten, self
	KillerName string `json:"killerName"` // 谁杀死的（如果是被其他蛇吃掉）
}
