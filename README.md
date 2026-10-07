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

## 📱 原生客户端

[下载最新 Release](https://github.com/zkeq/vibe-cook/releases/latest) · [查看自动构建](https://github.com/zkeq/vibe-cook/actions/workflows/native-release.yml)

客户端把本仓库的前端打包到应用中，复用首页、菜谱详情、购物清单、烹饪和 AI 组件。桌面使用 [MyGo](https://mygo.egoist.dev/docs/getting-started)，移动端使用 [Capacitor](https://capacitorjs.com/docs)。Vite 单独构建客户端，原有 Next.js 网站继续使用 `npm run build`；菜谱通过动态路由加载，新增菜谱不需要重新打包。

| 平台 | 构建产物 | 安装与签名 |
| --- | --- | --- |
| macOS 12+ | Universal DMG / App ZIP，兼容 Intel 和 Apple Silicon | DMG 中拖到 Applications；使用 ad-hoc 签名，尚未 Apple 公证 |
| Windows 10+ x64 | Setup EXE | 运行安装程序；尚未配置发布者签名，首次运行可能出现系统提示 |
| Android 7+ | APK | 默认 debug APK 可直接安装；正式发布可配置下方签名 Secrets |
| iOS / iPadOS 16.4+ | 未签名 IPA / Xcode Archive ZIP | 需要自己的 Apple 开发团队、证书和描述文件签名；不能直接安装或上传 TestFlight / App Store |

每个 Release 提供 `SHA256SUMS.txt`。发布构建产物不改变本仓库的 BUSL-1.1 许可范围。

### 线上接口

客户端启动不需要本地后端。默认连接现有服务，菜谱和 AI 需要联网：

- 菜谱：`https://cook-api.corerevive.cn/api/v1`
- AI 主厨：`https://cook.corerevive.cn/recipe-chef`
- AI 选菜：`https://cook.corerevive.cn/recipe-finder`

桌面通过 MyGo 原生 HTTP 读取流式 AI 回复，移动端通过 Capacitor 原生 HTTP 收到完整回复后显示。前端构建不包含 AI 服务端密钥。`NATIVE_API_URL` 可在构建时覆盖菜谱 API；桌面 HTTP 的域名白名单在 `native/desktop/main.go`，改域名时需同步更新。

### 本地启动与打包

使用 Node.js 22+，先运行 `npm ci`。客户端预览固定使用 **4178** 端口（严格检测占用），Next.js 网站仍使用 3000。

```bash
# 仅预览客户端前端
npm run native:dev

# macOS 桌面开发，需要 Go 1.27.1+ 和 Xcode Command Line Tools
npm run desktop:dev

# 在 Mac 上构建 macOS Universal + Windows x64
# 需要 Go 1.27.1+、完整 Xcode 和 NSIS（brew install makensis）
npm run desktop:build
```

Go 默认从 PATH 查找，也可通过 `VIBE_COOK_GO` 指定可执行文件。桌面产物位于 `native/release/darwin-universal` 和 `native/release/windows-amd64`。

```bash
# Android：需要 Java 21、Android SDK API 36 / Build Tools 35
# ANDROID_HOME 指向 SDK；Mac 默认自动查找 Android Studio 的 Java 和 SDK
npm run android:build

# iOS：只能在 Mac 上构建，需要 Xcode 26+ 和 CocoaPods
npm run ios:build

# 打开原生工程，在 IDE 内调试或配置自己的发布签名
npm run mobile:sync
npm run android:open
npm run ios:open
```

移动端产物位于 `native/release/android` 和 `native/release/ios`。iOS 的 `VibeCook.xcarchive` 可在 Xcode 中使用自己的开发团队签名导出。SDK、依赖、构建产物及签名文件均不提交到 Git。

### GitHub Actions 自动构建与 Release

工作流 `.github/workflows/native-release.yml` 在推送 `main`、提交 PR 或手动运行时检查 TypeScript、客户端适配代码及 Web 构建，并构建四个平台，把安装包保存在 Actions Artifacts。推送 `v*` 标签后，所有平台构建成功才会创建 GitHub Release 并上传安装包与校验文件。

发布新版本时更新 `package.json` 和锁文件的版本，再提交并推送标签：

```bash
npm version 0.1.2 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release 0.1.2"
git tag v0.1.2
git push github main
git push github v0.1.2
```

上述命令使用本工作区的 `github` remote；普通 clone 只有 `origin` 时替换 remote 名称。构建脚本自动同步桌面、Android 和 iOS 的版本号；标签与 `package.json` 不一致会阻止发布。

Android 默认提供 debug APK。要持续生成可升级的正式签名 APK，在仓库 Settings → Secrets and variables → Actions 设置：

| Secret | 内容 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | 你自己的 keystore 文件 Base64 内容 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密码 |
| `ANDROID_KEY_ALIAS` | 密钥别名 |
| `ANDROID_KEY_PASSWORD` | 密钥密码 |

本地正式签名使用对应的 `COOK_ANDROID_KEYSTORE`（文件路径）、`COOK_ANDROID_STORE_PASSWORD`、`COOK_ANDROID_KEY_ALIAS` 和 `COOK_ANDROID_KEY_PASSWORD` 环境变量。未配置 Android 发布签名时，各次 CI 的 debug 签名可能不同，升级安装需要先卸载旧包。Mac 公证、Windows 发布者签名和 iOS 分发签名需要另行配置自己的证书。

## 🙏 致谢

- 菜谱：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook) — 没有这份指南就没有 Vibe Cook
- 在线演示：<https://cook.corerevive.cn>

## 📄 许可

本项目**应用程序代码**开源协议为 **[Business Source License 1.1](./LICENSE)** © Zkeq。

- 可以查看、修改、再分发，以及**非生产**使用（学习、本地跑、评测）
- **禁止**将本软件或其修改版上架任何应用商店，**禁止**出售或作为商业产品对外提供
- 生产使用（含上架、售卖、对外提供服务）须向权利人取得商业授权：`admin@icodeq.com`
- 本版本自 **2030-08-19** 起改为 [GNU GPL v2 或更高版本](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html)

**结构化菜谱与配图**采用 **[The Unlicense](https://unlicense.org)**，与 HowToCook 相同，见文首数据集卡片。

如果这个项目让你今晚真的下厨了，欢迎 Star ⭐
