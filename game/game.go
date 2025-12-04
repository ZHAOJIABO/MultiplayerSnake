package game

import (
	"encoding/json"
	"sync"
	"time"
)

const (
	GridWidth      = 50
	GridHeight     = 50
	MaxFoods       = 10
	TickRate       = 50 * time.Millisecond // 每50毫秒更新一次，即20帧/秒
	MoveInterval   = 3                     // 蛇每3帧移动一次，实际速度约6.67步/秒
)

// Game 表示游戏实例
type Game struct {
	Snakes      map[string]*Snake // 玩家ID -> 蛇
	FoodManager *FoodManager
	mutex       sync.RWMutex
	BroadcastCh chan []byte // 用于发送游戏状态到所有客户端
}

// NewGame 创建新游戏
func NewGame(broadcastCh chan []byte) *Game {
	return &Game{
		Snakes:      make(map[string]*Snake),
		FoodManager: NewFoodManager(GridWidth, GridHeight, MaxFoods),
		BroadcastCh: broadcastCh,
	}
}

// Start 启动游戏循环
func (g *Game) Start() {
	ticker := time.NewTicker(TickRate)
	defer ticker.Stop()

	// 初始生成食物
	g.FoodManager.EnsureMinimumFoods(g.getOccupiedPoints())

	for range ticker.C {
		g.Update()
	}
}

// Update 更新游戏状态
func (g *Game) Update() {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	// 移动所有存活的蛇（按移动间隔控制速度）
	shouldCheckCollision := false
	for _, snake := range g.Snakes {
		if snake.Alive {
			snake.MoveCounter++
			// 只有当计数器达到移动间隔时才移动
			if snake.MoveCounter >= MoveInterval {
				snake.Move(GridWidth, GridHeight)
				snake.MoveCounter = 0
				shouldCheckCollision = true
			}
		}
	}

	// 只有当有蛇移动时才检查碰撞和食物
	if !shouldCheckCollision {
		// 即使没有移动，也要广播状态（保持20帧刷新）
		g.broadcastGameState()
		return
	}

	// 检查碰撞和食物
	for _, snake := range g.Snakes {
		if !snake.Alive {
			continue
		}

		head := snake.GetHead()

		// 撞墙逻辑已改为穿墙，不再需要检查撞墙死亡

		// 检查是否撞到自己（可以吃掉自己的尾部）
		if cutPosition := g.checkSelfCollision(snake); cutPosition > 0 {
			// 吃掉尾部，从cutPosition位置切断
			cutLength := len(snake.Body) - cutPosition
			snake.Body = snake.Body[:cutPosition]
			// 增加一点分数（吃掉的长度）
			snake.Score += cutLength
		}

		// 检查是否吃到其他蛇（新规则：长蛇吃短蛇）
		eatenSnake, canEat := g.checkSnakeCollisionWithEating(snake)
		if eatenSnake != nil {
			if canEat {
				// 当前蛇更长，吃掉对方
				eatenLength := len(eatenSnake.Body)
				eatenSnake.DeathReason = "eaten"
				eatenSnake.KillerName = snake.Name
				eatenSnake.Die()
				// 增加分数和长度
				snake.Score += eatenLength
				// 不移除尾部，让蛇增长
			} else {
				// 当前蛇更短或相等，自己死亡
				snake.DeathReason = "eaten"
				snake.KillerName = eatenSnake.Name
				snake.Die()
				continue
			}
		}

		// 检查是否吃到食物
		if g.FoodManager.IsFoodAt(head) {
			g.FoodManager.RemoveFood(head)
			snake.Grow()
			// 生成新食物
			g.FoodManager.SpawnFood(g.getOccupiedPoints())
		} else {
			// 没吃到食物或蛇，移除尾部
			if eatenSnake == nil {
				snake.RemoveTail()
			}
		}
	}

	// 确保场上有足够的食物
	g.FoodManager.EnsureMinimumFoods(g.getOccupiedPoints())

	// 广播游戏状态
	g.broadcastGameState()
}

// AddPlayer 添加新玩家
func (g *Game) AddPlayer(id, name string) *Snake {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	snake := NewSnake(id, name, GridWidth, GridHeight)
	g.Snakes[id] = snake
	return snake
}

// RemovePlayer 移除玩家
func (g *Game) RemovePlayer(id string) {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	delete(g.Snakes, id)
}

// UpdatePlayerDirection 更新玩家方向
func (g *Game) UpdatePlayerDirection(id string, direction Direction) {
	g.mutex.RLock()
	defer g.mutex.RUnlock()

	if snake, exists := g.Snakes[id]; exists {
		snake.SetDirection(direction)
	}
}

// checkSelfCollision 检查蛇是否撞到自己
// 返回碰撞位置（0表示没有碰撞，>0表示碰撞的索引位置）
func (g *Game) checkSelfCollision(snake *Snake) int {
	head := snake.GetHead()
	// 从第1个元素开始检查（跳过头部本身）
	for i := 1; i < len(snake.Body); i++ {
		if snake.Body[i].X == head.X && snake.Body[i].Y == head.Y {
			return i
		}
	}
	return 0
}

// checkSnakeCollisionWithEating 检查蛇是否撞到其他蛇，并判断谁吃谁
// 返回：被撞到的蛇，当前蛇是否能吃掉对方（true=能吃，false=被吃）
func (g *Game) checkSnakeCollisionWithEating(snake *Snake) (*Snake, bool) {
	head := snake.GetHead()
	myLength := len(snake.Body)

	for _, otherSnake := range g.Snakes {
		if otherSnake.ID == snake.ID || !otherSnake.Alive {
			continue
		}

		// 检查是否撞到其他蛇的身体
		for _, bodyPart := range otherSnake.Body {
			if bodyPart.X == head.X && bodyPart.Y == head.Y {
				otherLength := len(otherSnake.Body)
				// 如果当前蛇更长，可以吃掉对方；否则自己被吃
				canEat := myLength > otherLength
				return otherSnake, canEat
			}
		}
	}
	return nil, false
}

// getOccupiedPoints 获取所有被占用的点（所有蛇的身体）
func (g *Game) getOccupiedPoints() map[Point]bool {
	occupied := make(map[Point]bool)
	for _, snake := range g.Snakes {
		if snake.Alive {
			for _, point := range snake.Body {
				occupied[point] = true
			}
		}
	}
	return occupied
}

// broadcastGameState 广播游戏状态给所有客户端
func (g *Game) broadcastGameState() {
	players := make([]*PlayerState, 0, len(g.Snakes))
	for _, snake := range g.Snakes {
		players = append(players, snake.ToPlayerState())
	}

	state := GameState{
		Type:       "gameState",
		Players:    players,
		Foods:      g.FoodManager.GetFoods(),
		GridWidth:  GridWidth,
		GridHeight: GridHeight,
	}

	data, err := json.Marshal(state)
	if err != nil {
		return
	}

	// 发送到广播通道
	select {
	case g.BroadcastCh <- data:
	default:
		// 如果通道满了，跳过这次广播
	}
}
