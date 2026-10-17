全新橙色金属厨师帽图标：保留 Vibe Cook 的橙色与厨师帽标志，加入立体银色质感、柔和高光与环绕微光。Android、iOS、macOS 和 Windows 客户端统一换新图标，启动画面和网页图标同步更新。

延续 v0.1.5 的桌面烹饪页面修复：页面铺满窗口，窗口按钮融入现有顶栏，不再预留额外空白行。

- macOS：通用版，支持 Apple Silicon 和 Intel。安装 `.dmg` 后将应用拖到 Applications。
- Windows：x64 安装程序。
- Android：未配置发布签名时提供可安装的 debug APK；配置签名 Secrets 后生成 release APK。
- iOS：提供未签名 IPA 和 Xcode Archive，需使用自己的 Apple 开发团队、证书和描述文件签名后才能安装到真机。这些文件不能直接用于 TestFlight 或 App Store。

Mac 使用融入页面的标题栏，保留原生窗口按钮。首页、搜索、菜谱详情、购物清单、烹饪模式和 AI 使用同一份前端组件。

菜谱和 AI 功能需要联网。桌面和移动端 AI 均支持逐段流式回复。Android 朗读使用系统语音引擎，未安装中文语音时会给出提示。

本版本 macOS 使用本地 ad-hoc 签名，未做 Apple 公证；Windows 安装包未配置发布者签名。应用程序代码采用仓库的 BUSL-1.1 许可证，分发构建产物不改变许可范围。
