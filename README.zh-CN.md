# Refined Gemini

[English](./README.md) · **简体中文**

> **1:1 对齐 ChatGPT 网页端视觉与排版基准的 Google Gemini 浏览器扩展（Manifest V3）与油猴脚本（UserScript）。**

---

## 一、 核心改进概览

以 OpenAI 官方开源组件库（`openai/apps-sdk-ui`）的设计 Token 与排版规范为唯一基准，彻底解决原生 Gemini 网页端的阅读与交互痛点：

| 维度 | Gemini 原生痛点 | `Refined Gemini` 对齐 ChatGPT 后的表现 |
| :--- | :--- | :--- |
| **画布、全尺寸侧栏与强调色** | 泛冷蓝灰 Material 底色（`#f0f4f9`）、小窗口（`< 960px`）`<mat-sidenav>` 抽屉退回 `320px` 白底大胶囊与焦点黑框、杂乱皇家蓝控件 | **浅色**：画布 `#FFFFFF`、桌面侧栏与小窗抽屉统一 `#F9F9F9`（`260px` 紧凑 `34px` 行高）、卡片 `#F7F7F8`、选中项 `#ECECEC`<br>**深色**：画布 `#212121`、侧栏/抽屉 `#171717`、卡片 `#2A2A2A`、选中项 `#2F2F2F`<br>**品牌与强调色**：保留左上 Gemini 彩色极光星标（消除自动焦点黑框），接入 ChatGPT **`#0285FF`** 蓝色圆形发送按钮与主操作胶囊 |
| **浅蓝用户气泡与附件芯片** | 弹性收缩导致短句折行；`content-visibility: auto` 偶发吞掉首条消息；文件预览缩略图圆角不对称 | 采用 `--blue-50` **浅蓝用户气泡**（浅色 `#E5F3FF` / 深色 `#1A3550`，`20px` 圆角，完整列宽 `70%` 上限），气泡内文件/邮件附件重绘为纯白/深灰 `1px` 细框芯片，并锁定首轮消息可见性 |
| **全局统一字号与可调缩进** | 标题、引导语与卡片标题字号跳变（`17px~28px`）、多级列表缩进过深、中文引用斜体 | **正文、各级标题（`h1`~`h6`）、引导段落与全量组件标题（`.gds-*`）100% 统一字号（默认 `16px`）**，标题仅靠 `600` 加粗与段间距区分；列表支持 **`0% / 65% / 标准 GPT / 125%`** 四档切换 |
| **80+ 原生组件与沙盒图表统一管理** | 沙盒交互图（`<genui-sandbox>` / `<svg-code-block>`）、Deep Research 方案卡、Canvas 入口卡、Python 执行块、音频概览、问卷与追问卡风格割裂 | **三层全量组件接管**：穿透 `about:srcdoc`、`*.scf.usercontent.goog` 与行内 SVG 拓扑图同步浅/深色色板；统一重绘 Canvas 文档卡、Deep Research / Agent 计划卡、Python `.code-execution-block`、音频播客条、引用轮播、问卷与轻量 Toast；**对 `<web-preview>` 仅加外框，严密保护用户自建网页应用原始配色** |
| **无竖框表格与紧凑代码卡** | 厚重表格外框与假滚动条、浅色模式强套 `#141414` 黑底与 `46px` 虚高顶栏 | 极简 `14px` 无竖框横线表（首列 `0px` 共线）+ 一体化 `#F9F9F9` / `#171717` `12px` 圆角代码卡片（`32px` 顶栏 + OpenAI 语法高亮色板） |
| **防透字与防上移底部输入舱** | 滚动时文字从输入框底部露头，切换会话偶发触发输入框上移 | 100% 纯色不透明底座遮罩 + 外层 `.chat-container` `overflow-y: clip` 防滚动锁死 |

---

## 二、 `v1.9.0` 消息历史导航

- 对话左侧增加轻量刻度，每条对应一轮已加载消息。悬停或聚焦可预览提问和回复，点击直接定位，不移动输入框。
- 自动高亮当前阅读位置；指针附近的横杠形成平滑波峰，移开恢复等长。方向键与 Home / End 切换刻度，Enter 定位，Esc 收起预览，长列表可滚动。
- 至少加载三轮消息时显示；窗口宽度小于 768px 或对话边缘空间不足时隐藏。随消息更新并跟随扩展总开关。更早的消息由 Gemini 加载后加入导航；预览仅保留在当前页面内存，不保存、不上传。

### `v1.8.4` 模型与思考强度选择

- 轻量列表只保留模型名称与「低 / 中 / 高」三档，一次点击即可选择模型与思考强度，面板立即收起。
- 任务模式未提供思考强度时，仅显示模型列表；对话与任务往返切换后仍可使用，并保留手动选择。
- 模型列表读取 Gemini 当前可用选项，不写死模型 ID，不自动升级套餐或发送消息。
- 新对话默认选择高思考强度，可在扩展设置中关闭；保留已有对话的设置和本轮手动选择。高强度会消耗更多额度。

### `v1.7.0` 交互与细节升级

- **`Alt+Shift+G` 一键对比**：随时在原生 Gemini 与 Refined Gemini 之间切换，页面顶部弹出确认提示，暂停时工具栏图标显示 `OFF` 角标（可在 `chrome://extensions/shortcuts` 自定义；油猴脚本同样支持）。
- **设置面板重新设计**：顶部实时状态行；选项改用语义化标签（`标准 / 宽 / 超宽 / 自适应`，不再直接显示像素值）；悬停或聚焦时底栏显示该项说明；完整键盘操作（ARIA 单选组 + 方向键 + 可见焦点环）；**恢复默认支持 5 秒内撤销**。
- **情境化提示**：面板提示非 Gemini 页面、需要刷新或本地检测到的布局变化。点击“反馈”会将扩展版本、所选主题与检查失败项名称发送给 GitHub 以预填 Issue，不包含会话路径或对话内容，详见[隐私政策](./docs/PRIVACY.md)。
- **ChatGPT 风格等待指示**：用与正文基线对齐的柔和脉冲圆点替换 Gemini 彩色 Lottie 动画。
- **块级节奏修正**：表格、代码块上下统一 `12–16px` 间距（原生代码块上方叠加 `40px` 空白、表格上方为 `0px`）。
- **可选标题分级字号**（`scaledHeadings`）：`H1–H3` 为 `1.5 / 1.25 / 1.125` 倍，便于浏览长回答；默认关闭，保持统一 16px 设计。
- **`Ctrl+Enter` 可发现性**：开启后输入框占位符末尾提示 `· Ctrl+Enter 发送`（macOS 显示 `⌘+Enter`）。
- **无障碍**：Gemini 原生控件统一 `#0285FF` `:focus-visible` 焦点环，并适配 `prefers-reduced-motion`。
- **油猴脚本功能对齐**：脚本内置与扩展完全相同的设置面板（Shadow DOM 页内浮层，从脚本管理器菜单打开），多标签页设置实时同步。

---

## 三、 双语设置面板（`中 / EN`）

点击浏览器工具栏的 **Refined Gemini** 图标（或油猴菜单中的 **⚙️ 打开设置面板**）即可打开设置面板，所有选项**实时生效，无需刷新页面**：

- **界面语言（`中 / EN`）**：支持一键切换简体中文与英文界面（首次默认自动跟随浏览器语言）。
- **总开关**：随时一键开启或暂停美化（主页面、行内 SVG 与沙盒交互式图表同步无损还原），快捷键 `Alt+Shift+G`。
- **外观（`themeMode`）**：`自动` / `浅色` / `深色`。
- **内容宽度（`chatWidth`）**：`标准`（768px，默认，1:1 对齐 ChatGPT `48rem` 正文列宽）/ `宽`（920px）/ `超宽`（1120px）/ `自适应`（90%）。
- **字号（`fontSize`）**：`小` 15px / `标准` 16px（默认，行高 `1.68`）/ `大` 17px。
- **列表缩进（`indentScale`）**：`无` / `紧凑`（65%）/ **`标准`**（ChatGPT，默认）/ `宽松`（125%）。
- **隐藏 AI 头像（`hideAvatar`）**：正文、表格与代码块沿同一左基准线直排。
- **紧凑侧边栏（`compactSidebar`）**：`260px` 侧栏宽度配紧凑圆角会话行。
- **纯净模式（`cleanView`）**：隐藏底部免责声明、IP 定位栏与升级推广/发现卡片，同时保留轻量细框追问建议卡片。
- **标题分级字号（`scaledHeadings`）**：`H1–H3` 递进放大（默认关闭）。
- **`Ctrl / ⌘ + Enter` 发送（`ctrlEnterSend`）**：单按 `Enter` 仅换行（兼容中文输入法候选上屏），防长 Prompt 误触发送。

---

## 四、 安装方式

### 方式 A：Chrome / Edge / Brave / Arc 开发者模式加载

1. 克隆本仓库到本地：
   ```bash
   git clone https://github.com/Quiyyy/refined-gemini.git
   ```
2. 打开 `chrome://extensions`（Edge 打开 `edge://extensions`）。
3. 开启右上角 **开发者模式（Developer mode）**。
4. 点击 **加载已解压的扩展程序（Load unpacked）**，选择 `refined-gemini` 根目录即可生效。

### 方式 B：Tampermonkey / Violentmonkey / ScriptCat 油猴脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)、[Violentmonkey](https://violentmonkey.github.io/) 或 [ScriptCat（脚本猫）](https://scriptcat.org/)。
2. 访问仓库内的脚本直链即可触发一键安装（支持油猴菜单实时切换列宽、缩进、主题与中英文）：
   `https://raw.githubusercontent.com/Quiyyy/refined-gemini/main/userscript/refined-gemini.user.js`

---

## 五、 本地构建与商店打包

本项目**零第三方依赖**（仅使用 Node.js 18+ 内置标准库）：

```bash
# 重新生成多尺寸图标（含 Edge 商店所需的 300x300 徽标）并同步构建油猴脚本
npm run build

# 检查所有扩展与油猴脚本 JS 语法
npm run check

# 一键打包符合 Edge / Chrome 扩展商店规范的纯净上传包 -> dist/refined-gemini-v1.8.6-extension.zip
npm run pack
```

---

## 六、 项目目录结构

```text
refined-gemini/
├── manifest.json                 # Chrome / Edge Manifest V3 扩展清单（含 GenUI 沙盒帧支持）
├── package.json                  # 标准化构建、语法校验与商店 ZIP 打包脚本
├── _locales/                     # WebExtension 标准多语言包 (en, zh_CN)
├── icons/                        # SVG 矢量源文件与超采样抗锯齿图标 (16/32/48/128px)
├── src/
│   ├── defaults.js               # 默认值、选项集合与校验的单一数据源 (Single Source of Truth)
│   ├── background.js             # Service Worker：Alt+Shift+G 快捷开关与 OFF 角标
│   ├── content.css               # 1:1 ChatGPT 视觉与排版核心样式表
│   ├── content.js                # 首屏零闪烁缓存、沙盒跨帧同步、Ctrl+Enter、提示条与健康检查
│   ├── sandbox.css               # Generative UI 沙盒交互式图表对齐样式表
│   ├── sandbox.js                # 沙盒内 SVG / CSS 色板动态同源映射与无损还原脚本
│   └── popup/                    # 中英双语设置面板（同时复用为油猴脚本页内面板）
├── userscript/
│   └── refined-gemini.user.js    # 符合 Greasy Fork / ScriptCat 规范的双语油猴脚本
├── scripts/
│   ├── generate-icons.mjs        # 零依赖 PNG 图标与 300x300 商店徽标生成脚本
│   ├── build-userscript.mjs      # 将 src/* 与设置面板（Shadow DOM）打包为油猴脚本
│   └── pack-extension.mjs        # 一键生成商店上传专用 ZIP 压缩包
└── docs/
    ├── DESIGN_SPEC.zh-CN.md      # 视觉与排版设计规范（中文 / English）
    ├── PUBLISHING.zh-CN.md       # Edge 扩展商店与油猴市场上架完整指南
    ├── PRIVACY.md                # 中英双语隐私权政策（商店审核必填链接）
    └── preview.html              # 本地零依赖交互式对比预览沙盒
```

## 七、 相关文档

- **上架发布指南（Edge 插件商店 & 油猴脚本市场）**：[简体中文](./docs/PUBLISHING.zh-CN.md) · [English](./docs/PUBLISHING.md)
- **视觉与排版设计规范**：[简体中文](./docs/DESIGN_SPEC.zh-CN.md) · [English](./docs/DESIGN_SPEC.md)
- **隐私政策声明**：[PRIVACY.md](./docs/PRIVACY.md)
- **更新日志**：[CHANGELOG.md](./CHANGELOG.md)

## License

[MIT](./LICENSE)
