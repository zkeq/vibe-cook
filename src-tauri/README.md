# Tauri 2 接入点(预留)

本目录是**未来**把 Vibe Cook 前端打包成原生 App(含 iPad / App Store)的接入点。
当前阶段走 PWA，**尚未安装** Rust / Tauri CLI，此目录仅占位。

## 何时启用

当你需要以下能力时再接入：
- 上架 App Store / 从主屏图标启动的安装版 App
- 原生相机扫码、推送通知、文件系统访问

## 启用步骤(届时)

```bash
# 1. 安装 Rust 与 Tauri CLI
curl https://sh.rustup.rs -sSf | sh
npm install -D @tauri-apps/cli

# 2. 在 frontend/ 下初始化(会填充本目录)
npx tauri init

# 3. iOS/iPad 目标
npx tauri ios init
npx tauri ios dev
```

Next.js 已可静态导出，Tauri 直接托管前端产物，业务代码无需改动。
