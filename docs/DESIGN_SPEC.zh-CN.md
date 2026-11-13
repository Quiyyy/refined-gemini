# Refined Gemini — 1:1 对齐 ChatGPT 网页端设计规范（`v1.5.0`）

[English](./DESIGN_SPEC.md) · **简体中文**

> [!IMPORTANT]
> **核心设计准则**：放弃主观自创主题与繁琐装饰，以 **ChatGPT 网页端官方开源设计体系（`openai/apps-sdk-ui`）作为唯一基准（Single Source of Truth）**，全面对齐色板、全局统一字号、列表层级、无竖框表格、柔和代码卡片、轻量细框追问建议卡片与沙盒交互式图表；控制面板去除一切非必要说明文字，仅保留零认知负担的中英双语核心开关。

---

## 一、 视觉与组件 Token 对齐表（`openai/apps-sdk-ui`）

所有色彩、字号与间距均提取自 `variables-primitive.css`、`variables-semantic.css`、`Markdown.module.css` 与 `CodeBlock.module.css`：

| 维度 | Gemini 原生痛点 | `Refined Gemini` 精确 Token 规范 |
| :--- | :--- | :--- |
| **画布、侧栏与强调色** | 泛冷蓝灰 Material 底色（`#f0f4f9`）、刺眼皇家蓝控件 | **浅色**：画布 `#FFFFFF`、侧栏 `#F9F9F9`、选中项 `#ECECEC`；**深色**：画布 `#212121`、侧栏 `#171717`、选中项 `#2F2F2F`<br>**强调色**：恢复左上 Gemini 原生彩色星标，采用 ChatGPT **`#0285FF`**（`--blue-400`，悬停 `#0169CC`）点亮 `32×32` 发送圆钮与开关 |
| **浅蓝用户气泡与首条防丢** | 弹性父容器收缩导致短句折行；`content-visibility: auto` 偶发隐藏首轮用户消息 | 采用 `--blue-50` **浅蓝气泡**（`#E5F3FF` / `#1A3550`，`20px` 圆角，完整列宽 `70%` 上限），强制锁定首轮 `content-visibility: visible` |
| **全局统一字号与缩进比例** | 标题与引导语字号跳变（`17px~22px`）、多级列表缩进过深、`ol` 序号置空 | 默认容器 `800px` = **正文列宽 `768px`（`48rem`）**；**各级标题（`h1`~`h6`）、正文与非 `.markdown` 引导段落严格统一字号（`var(--rg-font-size, 16px)`）**，标题仅靠 `600` 加粗与段间距区分；列表提供 `0% / 65% / 标准 GPT / 125%` 四档切换 |
| **沙盒流程图与追问建议卡** | `SafeContentFrame` 沙盒图表（`#3186ff` / `#f2f0f0`）与厚重灰底追问块观感割裂 | `sandbox.css` + `sandbox.js` 深入 `*.scf.usercontent.goog` 沙盒同步映射浅/深色色板与统一 `16px` 标题（支持总开关无损还原）；`[data-testid="elicitation"]` 重绘为 `1px` 细框 `12px` 圆角轻量卡片 |
| **Markdown 表格** | 单元格 `min-width: 173px` 触发假横向滚动条、双底线、`17px` 大字号 | 极简 `14px` 无竖框横线表（`min-width: 0`），表头 `600` 粗体，末行无底线，首列 `padding-left: 0` 与正文共线 |
| **紧凑代码块与行内代码** | 浅色模式强套 `#141414` 黑底、`.header-formatted` `46px` 顶栏过高 | `#F9F9F9` / `#171717` 一体化 `12px` 圆角卡片，顶栏锁定 `32px`（`26×26` 按钮），`14px/1.5` 等宽字体映射 OpenAI 语法高亮色板；行内代码配 `1px` 内嵌微环 |
| **防透字与防上移底部输入舱** | 滚动时文字露头，或会话切换时 `scrollIntoView` 导致输入框上移 | 顶边齐平的 100% 纯色 `--rg-bg-canvas` 底座 + `.chat-container` `overflow-y: clip` 防滚动偏移锁死 |

---

## 二、 精简双语控制面板设计（`v1.4.0`）

面板移除所有次要解释副标题与灰色小字提示，支持一键切换简体中文与英文：

1. **语言切换（`uiLang`）**：`中` / `EN`（默认 `auto` 自动跟随浏览器语言）。
2. **总开关（`enabled`）**：实时开启或暂停美化，无需刷新页面。
3. **外观（`themeMode`）**：`跟随` / `浅色` / `深色`。
4. **列宽（`chatWidth`）**：`768px`（默认）/ `920px` / `1120px` / `90%`。
5. **字号（`fontSize`）**：`15px` / `16px`（默认）/ `17px`。
6. **缩进（`indentScale`）**：`0%` / `65%` / `标准 GPT`（默认）/ `125%`。
7. **功能开关**：`隐藏 AI 头像`、`紧凑侧边栏`、`纯净模式`、`Ctrl/⌘ + Enter 发送`。

> [!TIP]
> **防图标与公式乱码保障**：全局排版规则显式隔离并保留 `mat-icon`、`.google-symbols`、`Material Symbols Outlined` 连字图标字体及 `KaTeX` 数学字体。
