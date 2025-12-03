package game

import (
	"math/rand"
)

// FoodManager 管理游戏中的食物
type FoodManager struct {
	Foods      []Point
	GridWidth  int
	GridHeight int
	MaxFoods   int
}

// NewFoodManager 创建食物管理器
func NewFoodManager(gridWidth, gridHeight, maxFoods int) *FoodManager {
	return &FoodManager{
		Foods:      make([]Point, 0),
		GridWidth:  gridWidth,
		GridHeight: gridHeight,
		MaxFoods:   maxFoods,
	}
}

// SpawnFood 生成食物到随机位置
func (fm *FoodManager) SpawnFood(occupiedPoints map[Point]bool) {
	// 如果食物数量已达到最大值，不再生成
	if len(fm.Foods) >= fm.MaxFoods {
		return
	}

	// 尝试生成食物，最多尝试100次
	for i := 0; i < 100; i++ {
		x := rand.Intn(fm.GridWidth)
		y := rand.Intn(fm.GridHeight)
		point := Point{X: x, Y: y}

		// 确保食物不会生成在被占用的位置
		if !occupiedPoints[point] && !fm.isFoodAt(point) {
			fm.Foods = append(fm.Foods, point)
			return
		}
	}
}

// RemoveFood 移除指定位置的食物
func (fm *FoodManager) RemoveFood(point Point) bool {
	for i, food := range fm.Foods {
		if food.X == point.X && food.Y == point.Y {
			// 删除该食物
			fm.Foods = append(fm.Foods[:i], fm.Foods[i+1:]...)
			return true
		}
	}
	return false
}

// IsFoodAt 检查指定位置是否有食物
func (fm *FoodManager) IsFoodAt(point Point) bool {
	return fm.isFoodAt(point)
}

func (fm *FoodManager) isFoodAt(point Point) bool {
	for _, food := range fm.Foods {
		if food.X == point.X && food.Y == point.Y {
			return true
		}
	}
	return false
}

// GetFoods 获取所有食物
func (fm *FoodManager) GetFoods() []Point {
	return fm.Foods
}

// EnsureMinimumFoods 确保场上至少有一定数量的食物
func (fm *FoodManager) EnsureMinimumFoods(occupiedPoints map[Point]bool) {
	for len(fm.Foods) < fm.MaxFoods {
		fm.SpawnFood(occupiedPoints)
	}
}
