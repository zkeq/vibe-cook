# Vibe Cook 数据结构文档

本文档定义了前端和后端之间的数据契约。

## 目录

- [菜谱相关](#菜谱相关)
  - [RecipeSummary](#recipesummary) - 菜谱摘要
  - [Recipe](#recipe) - 完整菜谱
  - [Ingredient](#ingredient) - 食材
  - [RecipeStep](#recipestep) - 烹饪步骤
- [API 接口](#api-接口)

---

## 菜谱相关

### RecipeSummary

菜谱摘要，用于列表展示。

```typescript
interface RecipeSummary {
  id: string;              // 菜谱唯一 ID
  title: string;           // 菜谱标题
  summary?: string;        // 简短描述
  category: string;        // 分类（如：家常菜、川菜）
  difficulty: number;      // 难度 1-5 星
  duration_min: number;    // 烹饪时长（分钟）
  calories?: number;       // 卡路里
  cover_image?: string;    // 封面图片 URL
  tags?: string[];         // 标签（如：快手、下饭）
}
```

**示例：**
```json
{
  "id": "xihongshi-chaodan",
  "title": "西红柿炒鸡蛋",
  "summary": "一道酸甜开胃的家常菜肴",
  "category": "家常菜",
  "difficulty": 1,
  "duration_min": 15,
  "calories": 252,
  "tags": ["快手", "下饭", "新手友好"]
}
```

---

### Recipe

完整菜谱，包含所有详细信息。

```typescript
interface Recipe {
  // 基础信息（继承 RecipeSummary）
  id: string;
  title: string;
  summary: string;
  category: string;
  difficulty: number;
  duration_min: number;
  calories: number;
  tags: string[];

  // 图片
  cover_image: string;       // 封面图
  overview_image?: string;   // 概览图

  // 食材
  ingredients: Ingredient[];

  // 工具
  tools: string[];

  // 份数
  servings: {
    base: number;            // 基准份数
    formula: {               // 缩放公式（可选）
      name: string;
      expr: string;
    }[];
  };

  // 步骤
  steps: RecipeStep[];

  // 额外信息
  variants?: RecipeVariant[];  // 做法变体
  tips?: string[];             // 通用提示
}
```

---

### Ingredient

食材信息。

```typescript
interface Ingredient {
  name: string;           // 食材名称
  amount: string;         // 用量（如："1个(约180g)"）
  per_serving?: boolean;  // 是否随份数缩放
  optional?: boolean;     // 是否可选
  buying_tip?: string;    // 购买注意事项
}
```

**示例：**
```json
{
  "name": "西红柿",
  "amount": "1个(约180g)",
  "per_serving": true,
  "buying_tip": "选择成熟度适中、表皮光滑无裂纹的"
}
```

---

### RecipeStep

烹饪步骤。

```typescript
interface RecipeStep {
  index: number;          // 步骤序号
  title: string;          // 步骤标题
  instruction: string;    // 详细说明
  image?: string;         // 步骤图片
  duration_sec?: number;  // 计时器时长（秒）
  produces?: string;      // 产出物（可在后续步骤引用）
  tips?: string[];        // 该步骤的提示
}
```

---

## API 接口

### 1. 获取菜谱列表

**请求：**
```
GET /api/recipes
```

**查询参数：**
- `category` (string, 可选) - 分类筛选
- `search` (string, 可选) - 搜索关键词
- `page` (number, 可选) - 页码（从 1 开始）
- `limit` (number, 可选) - 每页数量

**响应：**
```json
{
  "data": [
    {
      "id": "xihongshi-chaodan",
      "title": "西红柿炒鸡蛋",
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### 2. 获取菜谱详情

**请求：**
```
GET /api/recipes/:id
```

**响应：**
```json
{
  "id": "xihongshi-chaodan",
  "title": "西红柿炒鸡蛋",
  "ingredients": [...],
  "steps": [...],
  ...
}
```

---

### 3. 搜索菜谱

**请求：**
```
GET /api/recipes/search?q=西红柿
```

**响应：**
```json
{
  "data": [...],
  "total": 5
}
```

---

### 4. 根据分类获取菜谱

**请求：**
```
GET /api/recipes/category/:category
```

**响应：**
```json
{
  "data": [...],
  "category": "家常菜"
}
```

---

## 状态码

- `200` - 成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器错误

## 错误响应格式

```json
{
  "error": {
    "code": "RECIPE_NOT_FOUND",
    "message": "菜谱不存在"
  }
}
```
