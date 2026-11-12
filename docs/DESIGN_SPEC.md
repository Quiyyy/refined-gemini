# Refined Gemini：1:1 对齐 ChatGPT 网页端设计规范与配置方案

> [!IMPORTANT]
> **核心设计准则**：放弃主观自创主题与复杂装饰，以 **ChatGPT 网页端成熟克制的视觉与排版体系作为唯一基准（Single Source of Truth）**，全面对齐字体、配色、缩进、表格、代码块与页面布局；在此之上仅提供高实用价值、零认知负担的可选配置项。

---

## 一、 视觉、色板与组件规范 1:1 对齐拆解（`v1.1.0`）

所有色彩、字号与间距均提取自 OpenAI 官方开源组件库 `openai/apps-sdk-ui`（`variables-primitive.css`、`variables-semantic.css`、`Markdown.module.css`、`CodeBlock.module.css`）：

| 维度 | Gemini 原生痛点 | `refined-gemini` 对齐 ChatGPT 后的精确 Token 表现 |
| :--- | :--- | :--- |
| **画布、侧栏与顶栏控件** | 泛冷蓝灰 Material 底色（`#f0f4f9`）、渐变雾化遮罩、天蓝色 `登录` 胶囊（`#A8C7FA`） | **浅色**：画布 `#FFFFFF`，侧栏 `#F9F9F9`，选中项 `#ECECEC`，用户气泡 `#F4F4F4`，主按钮 `#0D0D0D`（白字）<br>**深色**：画布 `#212121`，侧栏 `#171717`，选中项 `#2F2F2F`，用户气泡/输入舱 `#303030`，主按钮 `#FFFFFF`（黑字） |
| **首屏欢迎页（Zero-State）** | `36px Google Sans` 彩光标题与悬浮推广条 | `28px` / `600` / `-0.02em` 纯黑/纯白居中标题，单色收敛左上 Gemini 星标 |
| **正文字体、引用与公式** | `blockquote::before` 虚线伪元素 + 强制中文斜体；深色模式 `.katex-svg` 未反相 | 现代无衬线栈，正文 `16px` / `1.7`；`blockquote` 清除虚线伪元素，改为实心左竖线 + `font-style: normal`；深色模式 `.katex-svg` 显式 `invert(100%)` |
| **Markdown 表格** | 单元格 `min-width: 173px` 触发假横向滚动条、`::after` 双横线、`17px` 大字号 | **极简 `14px` 无竖框横线表**：`min-width: 0` 消除假溢出，末行 `border-bottom: none`，首列 `padding-left: 0` 与正文严格共线 |
| **代码块与行内代码** | 浅色模式强套 `#141414` 暗黑内壳、双边框、`-16px` 顶栏错位 | **`#F9F9F9` / `#171717` 一体化 `12px` 圆角卡片**（`14px` 等宽），映射 OpenAI 官方高亮色板（Keyword `#0169cc`/`#66b5ff`、Title/Type `#c0660d`/`#ffe48c`、String `#008635`/`#40c977`、Number `#8046d9`/`#ad7bf9`）；行内代码配 `1px` 内嵌微环 |
| **思维链、动作栏与发送钮** | 动作栏偏右错位、发送钮为 Material 浅蓝圆圈 | `model-thoughts` 幽灵折叠头 + `2px` 左导引线；动作栏左移 `-7px` 实现图标与正文 `0.0px` 对齐；输入舱配 **`32×32` `#0D0D0D` / `#FFFFFF` 圆形发送/停止按钮** |

---

## 二、 克制、零设计负担的「可选配置项」

在 1:1 复刻 ChatGPT 默认观感的基础上，插件 Popup 面板（同样采用 ChatGPT 极简黑白灰分栏控件）仅保留以下实用微调项：

1. **总开关（Master Toggle）**：一键实时开启/暂停美化，随时对比原生效果。
2. **外观配色（`themeMode`）**：`跟随页面（默认）` / `强制 ChatGPT 浅色` / `强制 ChatGPT 深色`。
3. **对话列宽度（`chatWidth`）**：`标准 768px（默认，1:1 对齐 ChatGPT）` / `适中 920px` / `宽屏 1120px` / `超宽 90%`（遇到超多列宽表或长代码时一键展开，无需纠结具体像素）。
4. **正文字号密度（`fontSize`）**：`紧凑 15px` / `标准 16px（默认）` / `宽松 17px`。
5. **隐藏 AI 回复头像（`hideAvatar`，默认开启）**：对齐 ChatGPT 无头像左基准线直排；若习惯保留 Gemini 星标可随时关闭。
6. **紧凑侧边栏（`compactSidebar`，默认开启）**：将侧栏定宽收敛至 ChatGPT 同款 `260px` 与 `8px` 圆角紧凑会话行。
7. **纯净降噪模式（`cleanView`，默认开启）**：隐藏底部免责声明、定位栏、升级推广按钮与回答末尾的追问建议气泡。
8. **`Ctrl / ⌘ + Enter` 发送（`ctrlEnterSend`，默认关闭）**：开启后单按 `Enter` 仅换行，防止撰写多段结构化 Prompt 时误触发送。

> [!TIP]
> **防图标乱码保障**：样式表在替换全局排版字体时，显式隔离并保留了 `mat-icon`、`.google-symbols`、`Material Symbols Outlined` 连字图标字体，确保侧边栏、工具栏与复制按钮图标 100% 正常显示。
