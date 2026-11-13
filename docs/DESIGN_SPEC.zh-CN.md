# Refined Gemini — 1:1 对齐 ChatGPT 网页端设计规范（`v1.6.1`）

[English](./DESIGN_SPEC.md) · **简体中文**

> [!IMPORTANT]
> **核心设计准则**：放弃主观自创主题与繁琐装饰，以 **ChatGPT 网页端官方开源设计体系（`openai/apps-sdk-ui`）作为唯一基准（Single Source of Truth）**，全面对齐色板、全局统一字号、列表层级、无竖框表格、柔和代码卡片、80+ 原生业务组件卡片以及沙盒交互式图表；控制面板去除一切非必要说明文字，仅保留零认知负担的中英双语核心开关。

---

## 一、 视觉与组件 Token 对齐表（`openai/apps-sdk-ui`）

所有色彩、字号与间距均提取自 `variables-primitive.css`、`variables-semantic.css`、`Markdown.module.css` 与 `CodeBlock.module.css`：

| 维度 | Gemini 原生痛点 | `Refined Gemini` 精确 Token 规范 |
| :--- | :--- | :--- |
| **画布、响应式侧栏与强调色** | 泛冷蓝灰 Material 底色（`#f0f4f9`）、`< 960px` 小窗口切换至 `<mat-sidenav>` 抽屉后退回 `320px` 纯白大胶囊与焦点黑框、刺眼皇家蓝控件 | **浅色**：画布 `#FFFFFF`、桌面 `<bard-sidenav>` 与小窗 `<mat-sidenav>` 统一 `#F9F9F9`（`260px` 宽、`34px` 行高、`13.5px` 字号、`8px` 胶囊与底部分割线）、卡片 `#F7F7F8`、选中项 `#ECECEC`；**深色**：画布 `#212121`、侧栏/抽屉 `#171717`、卡片 `#2A2A2A`、选中项 `#2F2F2F`<br>**强调色**：恢复左上 Gemini 原生彩色星标，采用 ChatGPT **`#0285FF`**（`--blue-400`，悬停 `#0169CC`）点亮发送圆钮、主操作胶囊与开关 |
| **浅蓝用户气泡与附件芯片** | 弹性父容器收缩导致短句折行；`content-visibility: auto` 偶发隐藏首轮消息；文件预览缩略图圆角不对称 | 采用 `--blue-50` **浅蓝气泡**（`#E5F3FF` / `#1A3550`，`20px` 圆角，完整列宽 `70%` 上限），气泡内附件重绘为纯白/深灰 `1px` 细框芯片，强制锁定首轮 `content-visibility: visible` |
| **全局统一字号与缩进比例** | 标题、引导语与 `.gds-*` 组件字号跳变（`17px~28px`）、多级列表缩进过深、`ol` 序号置空 | 默认容器 `800px` = **正文列宽 `768px`（`48rem`）**；**各级标题（`h1`~`h6`）、正文、引导段落与对话流全部自定义组件标题严格统一字号（`var(--rg-font-size, 16px)`）**，标题仅靠 `600` 加粗区分；列表提供 `0% / 65% / 标准 GPT / 125%` 四档切换 |
| **80+ 原生组件与沙盒图表三层接管** | `<genui-sandbox>` `about:srcdoc`、`<svg-code-block>`、Deep Research 方案卡、Canvas 入口卡、Python 执行块、音频概览（`32px` 臃肿圆角）与深色反相 Snackbar 观感割裂 | **Layer 1** 全局 `response-element` 字体与字号收束；**Layer 2** 统一 `1px` 细框 `12px~14px` 圆角重绘 Canvas 分屏与入口卡、Deep Research / Agent 计划卡、`.code-execution-block`、引用轮播、问卷、音频概览与轻量 Toast；**Layer 3** 穿透沙盒与行内 SVG 同步色板，同时**白名单隔离 `<web-preview>` 保护用户自建前端应用原始配色** |
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
