# Vibe Cook

跟着做就会。基于 [HowToCook](https://github.com/Anduin2017/HowToCook) 的沉浸式分步烹饪应用。

[在线演示](https://cook.corerevive.cn) · [后端](https://github.com/zkeq/vibe-cook-backend) · [开放数据](https://github.com/zkeq/vibe-cook-backend/tree/main/dataset)

[![Demo](https://img.shields.io/badge/demo-cook.corerevive.cn-ff6b35)](https://cook.corerevive.cn)
[![App License](https://img.shields.io/badge/license-BUSL--1.1-red)](./LICENSE)
[![Data License](https://img.shields.io/badge/data-Unlicense-lightgrey)](https://unlicense.org)

## 功能

| | |
| --- | --- |
| 食谱墙 | 封面、难度、时长、分类与搜索 |
| 全解图 | 原料、工具、份量换算、步骤总览 |
| 烹饪模式 | 全屏单步引导、计时、完成反馈、屏幕常亮 |
| 购物清单 | 按菜生成，份量可缩放 |
| AI 选菜 | 按手头食材与偏好推荐 |
| AI 厨师 | 烹饪过程中的火候、替代与步骤问答 |

菜谱原文来自 HowToCook（The Unlicense）。本项目将其结构化为 JSON，并提供分步引导界面。

```
HowToCook Markdown  →  结构化 JSON + 配图  →  API  →  前端逐步渲染
```

## 技术栈

- 前端：Next.js 16（App Router）、TypeScript、Tailwind CSS v4、shadcn/ui、motion、Zustand
- 交付：PWA（主屏、全屏、Wake Lock）
- Agent：EdgeOne Makers
- 后端：[FastAPI + SQLite](https://github.com/zkeq/vibe-cook-backend)

## 开放数据

结构化菜谱与配图单独授权，采用 **[The Unlicense](https://unlicense.org)**，与 HowToCook 相同。可用于二次开发（网站、小程序、API、研究、商业用途等），无需另行取得许可。

| 内容 | 位置 |
| --- | --- |
| JSON、索引、SQLite | [`vibe-cook-backend/tree/main/dataset`](https://github.com/zkeq/vibe-cook-backend/tree/main/dataset) |
| 配图原图（Git LFS） | [`vibe-cook-backend` 的 `dataset` 分支](https://github.com/zkeq/vibe-cook-backend/tree/dataset) |

```bash
# 结构化数据
git clone https://github.com/zkeq/vibe-cook-backend.git
# 见 dataset/json/

# 结构化数据 + 原图
git clone --branch dataset --single-branch \
  https://github.com/zkeq/vibe-cook-backend.git vibe-cook-dataset
cd vibe-cook-dataset && git lfs pull
```

- `dataset/json/recipes.json` 全量菜谱
- `dataset/json/recipes/<id>.json` 单份菜谱
- `dataset/json/index.json` 索引：`markdown_path` 对应 HowToCook 路径，`json_path` 对应本数据集文件
- 图片字段为相对路径（`ai-generated/`、`overview/`、`steps/`），由使用方自行拼接 CDN 或本地 `images/` 目录

应用程序代码不在上述 Unlicense 范围内，见「许可」。

## 本地开发

需同时运行 [后端](https://github.com/zkeq/vibe-cook-backend)（默认 `http://localhost:8000`）。也可使用 mock。

```bash
git clone https://github.com/zkeq/vibe-cook.git
cd vibe-cook
cp .env.example .env.local
```

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# NEXT_PUBLIC_USE_MOCK=true
```

```bash
npm install
npm run dev
```

<http://localhost:3000>

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | 后端 API，如 `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_USE_MOCK` | `true` 时使用内置 mock |
| `NEXT_PUBLIC_RECIPE_AGENT_URL` | Agent 分域部署时填写；同域留空 |
| `AI_GATEWAY_*` | 仅 EdgeOne Makers 使用，勿加 `NEXT_PUBLIC_` 前缀 |

Agent 需 Makers 运行时：

```bash
edgeone makers link
edgeone makers dev
```

部署：`npm run build`，或通过 EdgeOne Makers 连接本仓库后发布。

## 许可

| 范围 | 协议 |
| --- | --- |
| 本仓库及 [vibe-cook-backend](https://github.com/zkeq/vibe-cook-backend) 中的应用程序代码 | [Business Source License 1.1](./LICENSE) |
| 菜谱结构化数据与配图 | [The Unlicense](https://unlicense.org) |

**应用程序代码**（BUSL-1.1）：允许查看、修改、再分发及非生产使用。禁止将本应用或其衍生版本上架应用商店、出售，或作为商业产品对外提供。生产使用请联系 `admin@icodeq.com`。本版本自 2030-08-19 起改为 [GNU GPL v2 或更高版本](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)。

**数据与配图**（Unlicense）：可自由复制、修改、分发与商业使用，用于二次开发无需额外授权。

HowToCook 原文同样为 The Unlicense。

## 致谢

[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)
