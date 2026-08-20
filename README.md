# 🍳 Vibe Cook

### 跟着做就会

把「看着馋但迟迟不动手」变成「跟着一步步就做出来了」。

[HowToCook](https://github.com/Anduin2017/HowToCook) 的程序员菜谱，做成全屏、沉浸、一步一步带你做完的烹饪 App。

<p align="center">
  <a href="https://cook.corerevive.cn"><img src="https://img.shields.io/badge/🌐_在线体验-cook.corerevive.cn-ff6b35?style=for-the-badge" alt="Live Demo"></a>
  &nbsp;
  <a href="https://github.com/zkeq/vibe-cook-backend"><img src="https://img.shields.io/badge/🛠_后端-vibe--cook--backend-1e293b?style=for-the-badge" alt="Backend"></a>
  &nbsp;
  <img src="https://img.shields.io/badge/License-BUSL--1.1-red?style=for-the-badge" alt="BUSL-1.1">
</p>

<p align="center">
  <a href="https://cook.corerevive.cn">👉 打开 Vibe Cook</a>
  ·
  <a href="#-本地开发">本地开发</a>
  ·
  <a href="#-它能做什么">功能</a>
  ·
  <a href="#-开放数据">开放数据</a>
  ·
  <a href="https://github.com/Anduin2017/HowToCook">菜谱来源 HowToCook</a>
</p>

---

## ✨ 它能做什么

| | 功能 | 说明 |
| :---: | --- | --- |
| 🏠 | **食谱墙** | 封面、难度、时长、分类浏览，顶部搜索 |
| 🗺️ | **全解图** | 原料 · 工具 · 份量换算 · 步骤总览，一个「开始做饭」 |
| 🔥 | **烹饪模式** | 全屏单步引导、计时器、完成打勾、屏幕常亮 |
| 🛒 | **购物清单** | 按菜生成，一人食到宴客，份量自动缩放 |
| 🥗 | **AI 选菜** | 告诉它冰箱里有什么，帮你配今晚吃什么 |
| 👨‍🍳 | **AI 厨师** | 做菜过程中随时问：火候、替代、这一步怎么理解 |

## 🍳 烹饪体验

灶台边不想翻密密麻麻的文字。Vibe Cook 把每一道菜拆成闯关：

1. **选一道菜** — 卡片墙，像逛菜单
2. **看全解图** — 原料、工具、步骤一眼看完
3. **开始做饭** — 全屏只显示当前一步，做完打勾进入下一步
4. **做完庆祝** — 每一步都有正反馈，整道菜做完有成就感

屏幕常亮、可加到 iPad / 手机主屏，灶台边也能跟。

## 🧬 数据从哪来

```
HowToCook Markdown  →  LLM 结构化（JSON 分步 + 生图）  →  后端下发  →  前端逐步渲染
```

菜谱原文来自社区项目 **[程序员做饭指南 HowToCook](https://github.com/Anduin2017/HowToCook)**（The Unlicense）。本仓库是它的衍生作品：把 Markdown 做成可跟做的 App。

## 🛠️ 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16（App Router）+ TypeScript |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 动效 | motion |
| 状态 | Zustand |
| 交付 | PWA（主屏、全屏、Wake Lock） |
| Agent | EdgeOne Makers（选菜 / 厨师） |
| 后端 | [FastAPI + SQLite](https://github.com/zkeq/vibe-cook-backend) |

## 🚀 本地开发

先启动 [后端](https://github.com/zkeq/vibe-cook-backend)（默认 `http://localhost:8000`）。没有后端也可以走 mock。

```bash
git clone https://github.com/zkeq/vibe-cook.git
cd vibe-cook
cp .env.example .env.local
```

`.env.local` 示例：

```bash
# 对接本地后端
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# 没有后端时打开 mock
# NEXT_PUBLIC_USE_MOCK=true
```

```bash
npm install
npm run dev
```

打开 👉 <http://localhost:3000>

### 环境变量

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | 后端 API，例如 `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_USE_MOCK` | `true` 时走内置 mock |
| `NEXT_PUBLIC_RECIPE_AGENT_URL` | Agent 分域部署时填写；同域留空 |
| `AI_GATEWAY_*` | 仅 EdgeOne Makers 使用，**不要**加 `NEXT_PUBLIC_` 前缀 |

## 🤖 AI Agent（可选）

首页有 **选菜 Agent**，详情 / 烹饪页有带上下文的 **厨师 Agent**。

```bash
edgeone makers link
edgeone makers dev
```

`makers dev` 会同时拉起 Web 和 Agent。只跑 `npm run dev` 没有 Makers 运行时。

## 📦 部署

- 静态 / Node：`npm run build`
- EdgeOne Makers：仓库连到 Makers 项目后 `edgeone makers deploy`
- 后端单独部署 → [vibe-cook-backend](https://github.com/zkeq/vibe-cook-backend)

## 📂 开放数据

Vibe Cook 把 HowToCook 的 Markdown 做成了结构化菜谱（分步 JSON + 封面 / 全解图 / 步骤图）。**数据和配图单独开放**，协议与上游 [HowToCook](https://github.com/Anduin2017/HowToCook) 相同：**[The Unlicense](https://unlicense.org)**（公共领域）。

欢迎基于这份数据做二次开发：自己的网站、小程序、API、训练、本地工具都可以，包括商业使用。不需要再走作者的对象存储。

| 你要什么 | 在哪 |
| --- | --- |
| 结构化 JSON、索引、SQLite | [`vibe-cook-backend/dataset`](https://github.com/zkeq/vibe-cook-backend/tree/main/dataset)（`main` 分支上的文件夹） |
| 配图原图（Git LFS，未压缩） | 同一仓库的 [`dataset` 分支](https://github.com/zkeq/vibe-cook-backend/tree/dataset) |

```bash
# 结构化数据（体积小）
git clone https://github.com/zkeq/vibe-cook-backend.git
# 文件在 dataset/json/

# 连原图一起要（约 6GB）
git clone --branch dataset --single-branch https://github.com/zkeq/vibe-cook-backend.git vibe-cook-dataset
cd vibe-cook-dataset && git lfs pull
```

- 全量：`dataset/json/recipes.json`
- 单份：`dataset/json/recipes/<id>.json`
- 索引：`dataset/json/index.json`  
  - `markdown_path`：对应 HowToCook 原仓库路径，如 `dishes/aquatic/咖喱炒蟹.md`  
  - `json_path`：本数据集里的 JSON 文件
- 图片字段只存相对路径（`ai-generated/...`、`overview/...`、`steps/...`），自己拼 CDN 或拼本地 `images/` 目录

应用程序（本仓库的 Next.js 前端、以及后端服务代码）**不是** Unlicense，见下一节。

## 🙏 致谢

- 菜谱：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook) — 没有这份指南就没有 Vibe Cook
- 在线演示：<https://cook.corerevive.cn>

## 📄 许可

分两部分，不要混在一起：

### 1. 应用程序代码（本仓库 + 后端代码）

**[Business Source License 1.1](./LICENSE)** © Zkeq

- 可以查看、修改、再分发，以及非生产使用（学习、本地跑、评测）
- **不可以**把 Vibe Cook 这套 App（或其修改版）上架应用商店、出售，或当成你的商业产品对外提供
- 若要生产使用，请联系 `admin@icodeq.com` 取得商业授权
- 本版本自 **2030-08-19** 起改为 [GNU GPL v2 或更高版本](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)

### 2. 菜谱数据与配图

**[The Unlicense](https://unlicense.org)**，与 HowToCook 一致。

任何人都可以自由复制、修改、发布、使用、出售或再分发这些数据和图片，无论是否商业目的。用它们二次开发自己的产品，不需要再向 Vibe Cook 要授权。约束的是「不要把我这套 App 拿去上架/收费」，不是「数据不能用」。

如果这个项目让你今晚真的下厨了，欢迎 Star ⭐
