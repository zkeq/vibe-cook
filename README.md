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
  <a href="https://github.com/zkeq/vibe-cook/releases/latest">下载客户端</a>
  ·
  <a href="#-本地开发">本地开发</a>
  ·
  <a href="#-它能做什么">功能</a>
  ·
  <a href="https://github.com/Anduin2017/HowToCook">菜谱来源 HowToCook</a>
</p>

<table>
<tr>
<td>

**📦 回馈社区的开放数据集** · [The Unlicense](https://unlicense.org)

本项目的数据来自社区的 [HowToCook](https://github.com/Anduin2017/HowToCook)。做 App 的过程中，我们把原文 Markdown 做成了结构化 JSON，并为每道菜生成了配图。数据源于社区，便以与上游相同的协议交还给社区——欢迎二次开发以及补充（含商用）。

开放数据在 [`vibe-cook-backend` 的 `dataset` 分支](https://github.com/zkeq/vibe-cook-backend/tree/dataset)：JSON、索引、配图原图（Git LFS）。`index.json` 里 `markdown_path` 对 HowToCook，`json_path` 对本数据集。

</td>
</tr>
</table>

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
| 交付 | PWA + MyGo 桌面客户端 + Capacitor 移动客户端 |
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

## 📱 客户端

[下载最新版本](https://github.com/zkeq/vibe-cook/releases/latest)

macOS 和 Windows 客户端使用 [MyGo](https://mygo.egoist.dev/) 构建，Android 和 iOS 客户端使用 [Capacitor](https://capacitorjs.com/) 构建。各平台复用本项目的前端，连接现有菜谱与 AI 服务。

## 🙏 致谢

- 菜谱：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook) — 没有这份指南就没有 Vibe Cook
- 客户端框架：[egoist/MyGo](https://github.com/egoist/mygo) 和 [Ionic/Capacitor](https://github.com/ionic-team/capacitor)，感谢它们让前端能够跨平台运行。
- 在线演示：<https://cook.corerevive.cn>

## 📄 许可

本项目**应用程序代码**开源协议为 **[Business Source License 1.1](./LICENSE)** © Zkeq。

- 可以查看、修改、再分发，以及**非生产**使用（学习、本地跑、评测）
- **禁止**将本软件或其修改版上架任何应用商店，**禁止**出售或作为商业产品对外提供
- 生产使用（含上架、售卖、对外提供服务）须向权利人取得商业授权：`admin@icodeq.com`
- 本版本自 **2030-08-19** 起改为 [GNU GPL v2 或更高版本](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)

**结构化菜谱与配图**采用 **[The Unlicense](https://unlicense.org)**，与 HowToCook 相同，见文首数据集卡片。

如果这个项目让你今晚真的下厨了，欢迎 Star ⭐
