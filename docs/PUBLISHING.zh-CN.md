# 上架发布指南：Microsoft Edge 扩展商店 & 油猴脚本市场

[English](./PUBLISHING.md) · **简体中文**

本仓库已完成国际化与打包规范化（`_locales/` 多语言清单、`300×300` 商店徽标、隐私声明与零外部更新链接的合规油猴头），可直接上架至 **Microsoft Edge Add-ons（Edge 插件市场）** 以及 **Greasy Fork / ScriptCat（油猴脚本市场）**。

---

## 第一部分：上架到 Microsoft Edge Add-ons（Edge 扩展商店）

> [!TIP]
> **零费用优势**：与 Chrome Web Store 收取 \$5 注册费不同，**微软 Edge 扩展开发者账号对个人完全免费（\$0）**，且支持国内主流浏览器（Edge、支持安装 Edge 商店扩展的 Chromium 浏览器）直接一键安装。

### 第 1 步：注册微软合作伙伴中心开发者账号（免费）

1. 准备一个**个人微软账号**（`@outlook.com` / `@hotmail.com` / `@live.com`，注意不要使用企业或学校组织账号）。
2. 打开微软 Edge 扩展开发者注册页：
   <https://partner.microsoft.com/dashboard/microsoftedge/public/login>
3. 账户类型选择 **Individual（个人）**，填写开发者显示名称（如 `Quiyyy`）与联系邮箱，完成免费验证即可进入后台面板。

### 第 2 步：一键生成符合商店规范的 ZIP 压缩包

Edge 商店要求 ZIP 根目录直接包含 `manifest.json`，且不包含 `.git`、`docs`、`scripts` 等开发文件。在仓库根目录运行：

```bash
npm run pack
```

构建完成后，将自动生成：
- **商店上传包**：`dist/refined-gemini-v1.4.0-extension.zip`
- **300×300 商店徽标**：`docs/assets/store-logo-300.png`（已自动预生成）

### 第 3 步：创建新扩展并上传包

1. 在 Partner Center 左侧菜单点击 **Microsoft Edge -> Overview -> Create new extension**。
2. 在 **Packages** 页面拖入 `dist/refined-gemini-v1.4.0-extension.zip` 上传，系统会自动解析 `_locales/en`（默认语言）与 `_locales/zh_CN`（简体中文）。

### 第 4 步：填写属性与隐私信息（Properties & Availability）

- **Availability（可见范围）**：选择 `Public`（公开），市场勾选全部国家/地区。
- **Category（分类）**：选择 **`Productivity`（效率与生产工具）**。
- **Privacy Policy URL（隐私政策链接，必填）**：直接填入本仓库双语隐私声明地址：
  ```text
  https://github.com/Quiyyy/refined-gemini/blob/main/docs/PRIVACY.md
  ```
- **Website / Support URL**：
  ```text
  https://github.com/Quiyyy/refined-gemini/issues
  ```
- **Does your extension collect personal data?（是否收集个人数据）**：勾选 **No（否）**。

### 第 5 步：填写中英文商店详情页（Store Listings）

系统会根据 `_locales` 自动列出 `English` 与 `Chinese (Simplified)` 两个语言页，可分别复制以下文案：

#### 1. `Chinese (Simplified)`（简体中文详情）
- **简短描述（Short description）**：自动从 `_locales/zh_CN/messages.json` 读取，无需重复修改。
- **详细说明（Detailed description）**：
  ```text
  Refined Gemini 将 Google Gemini 网页端的视觉与排版 1:1 对齐至 ChatGPT 网页端标准，带来克制、高对比度、无干扰的沉浸式阅读与提问体验：

  • 纯净画布与强调色：浅色纯白 (#FFFFFF) / 深色深灰 (#212121) 画布，搭配浅蓝用户消息气泡 (#E5F3FF) 与 #0285FF 圆形发送按钮。
  • 可调列表缩进比例：默认 1:1 对齐 ChatGPT 列表层级，并支持 0% / 65% / 标准 GPT / 125% 四档实时切换。
  • 紧凑代码块与无竖框表格：统一柔和圆角代码卡片（OpenAI 官方语法高亮色板）与极简横线表格，消除假横向滚动条。
  • 零认知负担双语面板：支持中 / EN 一键切换，提供列宽（768px~90%）、字号（15~17px）、隐藏 AI 头像、紧凑侧边栏、纯净模式与 Ctrl+Enter 发送开关，所有修改实时生效。
  • 100% 本地运行：零数据收集、零外部网络请求，MIT 协议开源透明。
  ```
- **搜索关键词（Search terms，最多 7 个）**：`gemini`, `chatgpt`, `google gemini`, `gemini ui`, `gemini theme`, `markdown`, `ai chat`

#### 2. `English`（英文详情）
- **Detailed description**：
  ```text
  Refined Gemini aligns the Google Gemini Web UI 1:1 with ChatGPT's clean typography, color surfaces, and layout standards:

  • Clean Surfaces & Accents: Crisp white (#FFFFFF) and charcoal (#212121) canvases paired with soft-blue user bubbles (#E5F3FF) and ChatGPT #0285FF accent controls.
  • Configurable Indentation: Defaults 1:1 to OpenAI Markdown list hierarchy, with instant 0% / 65% / GPT / 125% presets.
  • Compact Code Cards & Borderless Tables: Unified rounded code blocks with OpenAI syntax highlighting and clean horizontal-rule tables without fake scrollbars.
  • Streamlined Bilingual Popup (EN / 中文): Instant live controls for column width (768px–90%), font size (15–17px), hiding AI avatars, compact sidebar, clean view, and Ctrl/Cmd + Enter to send.
  • Privacy First: Runs 100% locally in your browser with zero data collection and zero network requests. Open-source under MIT.
  ```
- **图像资源上传**：
  - **Store Logo（商店徽标，`300×300` PNG）**：上传仓库内的 `docs/assets/store-logo-300.png`。
  - **Screenshots（宣传截图，至少 1 张，推荐尺寸 `1280×800` PNG）**：将启用插件后的浅色对话页、深色代码块页与 Popup 面板裁剪/缩放到 `1280×800` 上传即可。

### 第 6 步：填写审核备注并提交（Notes for Certification）

在 **Publish -> Notes for certification** 粘贴以下英文说明，可大幅加快人工审核速度（通常 **1~3 个工作日**过审）：

```text
Single Purpose: Customizes the visual appearance, typography, and keyboard shortcut (Ctrl+Enter) of https://gemini.google.com/* locally in the user's browser.
Permissions Justification:
- "storage": Used solely to persist local UI preferences (theme, column width, font size, indentation scale, and UI language) via chrome.storage.sync.
- Host "https://gemini.google.com/*": Content CSS/JS is injected only on Google Gemini web pages to apply styling and optional Ctrl+Enter send behavior.
No user data is collected or transmitted externally. No login credentials are required to test—open https://gemini.google.com/app and click the extension toolbar icon to test all real-time toggles.
```

> **后续版本更新**：修改代码后递增 `package.json` 与 `manifest.json` 版本号，运行 `npm run pack`，在 Partner Center 点击 **Update package** 上传新 ZIP 提交即可。

---

## 第二部分：上架到油猴脚本市场（Greasy Fork & ScriptCat 脚本猫）

本项目的 `scripts/build-userscript.mjs` 生成的 `userscript/refined-gemini.user.js` 已严格遵循油猴市场规范：
- 具备完整的 `@name` / `@name:zh-CN` / `@description` / `@description:zh-CN` 多语言检索头；
- 声明标准 SPDX 开源许可证 `@license MIT`；
- 代码保持未混淆可读状态（符合 Greasy Fork 强制代码审查要求）；
- **未写死外部 `@updateURL` / `@downloadURL`**（Greasy Fork 明确禁止托管脚本包含外部更新地址，否则会拒绝导入）。

### 渠道 A：发布到 Greasy Fork（全球最大油猴市场，支持 GitHub 自动同步）

1. 打开 <https://greasyfork.org/zh-CN>，使用你的 **GitHub 账号**一键登录。
2. 点击右上角个人用户名，进入个人主页后点击 **发布你编写的脚本（Post a script）**。
3. **推荐配置 GitHub Raw 自动导入与自动更新**：
   - 在发布页底部切换到 **从 URL 导入（Import from URL）**，填入本仓库脚本的 Raw 地址：
     ```text
     https://raw.githubusercontent.com/Quiyyy/refined-gemini/main/userscript/refined-gemini.user.js
     ```
   - 同步方式选择 **自动（Automatic）**。
   - 在脚本附加信息（Additional info）中粘贴 `README.zh-CN.md` 的功能表格即可点击发布（即时上线，无需漫长人工排队！）。
4. **（可选）开启 GitHub Push 实时 Webhook 同步**：
   - 在 Greasy Fork 个人主页点击 **设置 Webhook（Set up GitHub webhook）**，复制显示的 Payload URL 与 Secret。
   - 打开 GitHub 仓库 `Settings -> Webhooks -> Add webhook`：
     - **Payload URL**：粘贴 Greasy Fork 提供的地址
     - **Content type**：选择 `application/json`
     - **Secret**：粘贴对应密钥
     - **Events**：选择 `Just the push event`
   - 配置完成后，今后每次运行 `npm run build && git push`，Greasy Fork 会自动拉取并发布新版本！

### 渠道 B：发布到 ScriptCat 脚本猫（国内免代理极速访问，兼容 Tampermonkey）

1. 打开 <https://scriptcat.org/>，使用 GitHub 账号登录。
2. 点击右上角 **发布脚本**，类型选择 **普通脚本**。
3. 可直接粘贴 `userscript/refined-gemini.user.js` 源码，或在脚本管理页绑定上述 GitHub Raw 地址开启自动同步，填写中文简介后点击发布即可立即上线。
