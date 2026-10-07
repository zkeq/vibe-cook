修复 iOS / iPadOS 首次打开时，允许联网后仍需重启应用才能加载数据的问题。读取请求遇到网络连接失败时会短暂重试，回到前台后立即重试；AI 继续使用浏览器流式请求。

- macOS：通用版，支持 Apple Silicon 和 Intel。安装 `.dmg` 后将应用拖到 Applications。
- Windows：x64 安装程序。
- Android：未配置发布签名时提供可安装的 debug APK；配置签名 Secrets 后生成 release APK。
- iOS：提供未签名 IPA 和 Xcode Archive，需使用自己的 Apple 开发团队、证书和描述文件签名后才能安装到真机。这些文件不能直接用于 TestFlight 或 App Store。

Mac 使用融入页面的标题栏，保留原生窗口按钮。首页、搜索、菜谱详情、购物清单、烹饪模式和 AI 使用同一份前端组件。

菜谱和 AI 功能需要联网。桌面和移动端 AI 均支持逐段流式回复。Android 朗读使用系统语音引擎，未安装中文语音时会给出提示。

本版本 macOS 使用本地 ad-hoc 签名，未做 Apple 公证；Windows 安装包未配置发布者签名。应用程序代码采用仓库的 BUSL-1.1 许可证，分发构建产物不改变许可范围。
