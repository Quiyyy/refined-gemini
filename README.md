# Refined Gemini

> **1:1 对齐 ChatGPT 网页端视觉与排版基准的 Google Gemini 浏览器扩展（Manifest V3 & UserScript）**

**核心设计准则**：放弃花哨的主观自创主题与复杂装饰，以 **ChatGPT 网页端成熟克制的视觉与排版体系作为唯一基准（Single Source of Truth）**，全面对齐字体、配色、缩进、无竖框表格、柔和圆角代码卡片与单左基准线页面布局；在此之上仅提供高实用价值、零认知负担的可选配置项。

---

## 一、 视觉、排版与交互控件 1:1 对齐拆解（`v1.3.0`）

以 OpenAI 官方开源组件库（`openai/apps-sdk-ui`）的设计 Token 与组件规范为精确基准：

| 维度 | Gemini 原生痛点 | `refined-gemini` 对齐 ChatGPT 后的表现 |
| :--- | :--- | :--- |
| **画布、侧栏与强调色点缀** | 泛冷蓝灰的 Material 底色（`#f0f4f9`）、单调灰暗或刺眼皇家蓝控件 | **浅色**：画布纯白 `#FFFFFF`，侧栏 `#F9F9F9`，选中胶囊 `#ECECEC`<br>**深色**：画布 `#212121`，侧栏 `#171717`，选中胶囊 `#2F2F2F`<br>**强调色与品牌**：保留左上 Gemini 原生彩色极光星标，接入 ChatGPT 官方强调蓝 **`#0285FF`**（发送圆钮、激活工具胶囊与面板开关） |
| **浅蓝用户气泡与防过早折行** | 嵌套弹性容器百分比回环导致 10 字短消息被强行折成两行；轮次间距松散 | 采用 OpenAI `--blue-50` **浅蓝用户气泡**（浅色 `#E5F3FF` / 深色 `#1A3550`，`20px` 圆角），按完整对话列宽 `70%` 计算最大宽度，短句始终单行舒展；轮次间距收敛至 `~20px` |
| **可配置缩进比例（默认对齐 GPT）** | 多级列表层层叠加过深缩进、`ol` 列表序号被隐藏、中文引用强制斜体 | **默认 1:1 对齐 OpenAI `Markdown.module.css`**（列表 `1.625em` 缩进 + 子列表 `1.5em` + `li` `0.375em` 间距，修复 `•` / `◦` / `▪` 与 `1. 2. 3.` 外置标号，一级段落/标题/表格/代码块严格 `0px` 共线），同时支持切换 **`无 0%` / `紧凑 65%` / `标准 GPT` / `宽松 125%`** 四档缩进；正文 `16px` / `1.68` 行高 / `768px`（`48rem`）标准列宽 |
| **无竖框 Markdown 表格** | 厚重圆角外框、强制 `min-width: 173px` 导致常规 4 列表格出现横向滚动条、`17px` 过大字号 | **极简无竖框横线表**（`14px`）：彻底解除伪溢出滚动条与双边框，表头 `600` 粗体，末行无多余底线，**首列 `padding-left: 0` 与正文左基准线 `0px` 对齐** |
| **紧凑代码块（OpenAI 语法色板）** | 浅色模式下仍强套 `#141414` 纯黑内壳、语言栏高度虚高（`46px`）导致语言名到首行代码间距过大 | **一体化柔和圆角卡片**（浅色 `#F9F9F9` / 深色 `#171717`，`32px` 紧凑顶栏 + `14px/1.5` 等宽代码），1:1 映射 OpenAI 官方语法色板（蓝 `#0169cc`/`#66b5ff`、琥珀 `#c0660d`/`#ffe48c`、翠绿 `#008635`/`#40c977`、紫 `#8046d9`/`#ad7bf9`） |
| **思维链与防透字底部输入舱** | 滚动时对话文字从输入框下方露头或在顶部半透明残影穿模 | 底部输入舱采用 **100% 纯色画布底座遮罩**（零下方露字、零半透明残影），上浮 `20px`，配 ChatGPT 同款 **`32×32` `#0285FF` 蓝色圆形发送按钮** |

---

## 二、 可选配置面板（零设计负担）

点击浏览器工具栏的 **Refined Gemini** 图标，即可打开配以 ChatGPT `#0285FF` 强调色开关的极简设置面板（所有修改无需刷新页面，**实时生效**）：

1. **总开关（Master Toggle）**：一键实时开启/暂停美化，随时对比原生 Gemini 效果。
2. **外观配色（`themeMode`）**：`跟随页面（默认）` / `浅色` / `深色`。
3. **对话列宽度（`chatWidth`）**：`标准 768（默认，800px 容器 = 768px 正文列宽 1:1 对齐 ChatGPT 48rem）` / `适中 920px` / `宽屏 1120px` / `超宽 90%`。
4. **正文字号密度（`fontSize`）**：`紧凑 15px` / `标准 16px（默认，行高 1.68）` / `宽松 17px`。
5. **缩进比例（`indentScale`）**：`无 0%（全行顶格内联标号）` / `紧凑 65%` / **`标准 GPT（默认，1:1 对齐 OpenAI Markdown.module.css 列表层级）`** / `宽松 125%`。
6. **隐藏 AI 回复头像（`hideAvatar`，默认开启）**：对齐 ChatGPT 无头像左基准线直排；若习惯保留 Gemini 星标可随时关闭。
7. **紧凑侧边栏（`compactSidebar`，默认开启）**：将展开态侧栏收敛至 ChatGPT 同款 `260px` 定宽与 `8px` 圆角紧凑会话行（保留原生折叠窄栏能力）。
8. **纯净降噪模式（`cleanView`，默认开启）**：隐藏底部免责声明、IP 定位栏、Upgrade 推广按钮与回答末尾追问建议气泡。
9. **`Ctrl / ⌘ + Enter` 发送（`ctrlEnterSend`，默认关闭）**：开启后单按 `Enter` 仅换行（兼容中文输入法候选上屏），防止撰写多段结构化 Prompt 时误触发送。

> **防图标乱码保障**：样式表在替换全局排版字体时，显式隔离并保留了 `mat-icon`、`.google-symbols`、`Material Symbols Outlined` 连字图标字体及 `KaTeX` 数学字体，确保侧边栏、工具栏、复制按钮图标与数学公式 100% 正常显示。

---

## 三、 安装方式

### 方式 A：Chrome / Edge / Brave / Arc 扩展安装（推荐，含完整可视化设置面板）

1. 克隆或下载本仓库到本地：
   ```bash
   git clone https://github.com/Quiyyy/refined-gemini.git
   ```
2. 在浏览器地址栏打开 `chrome://extensions`（Edge 打开 `edge://extensions`）。
3. 开启右上角的 **开发者模式（Developer mode）**。
4. 点击左上角 **加载已解压的扩展程序（Load unpacked）**，选择克隆下来的 `refined-gemini` 根目录即可立即生效。

### 方式 B：Tampermonkey / Violentmonkey 油猴脚本

如果你使用 Firefox / Safari 或偏好油猴脚本管理，可直接打开并安装仓库内的 [`userscript/refined-gemini.user.js`](./userscript/refined-gemini.user.js)，支持通过油猴菜单一键切换开关、列宽、缩进比例与配色。

---

## 四、 目录结构

```text
refined-gemini/
├── manifest.json                 # Chrome / Edge Manifest V3 扩展配置（最小权限仅 storage）
├── icons/                        # 扩展多尺寸抗锯齿图标 (16/32/48/128px & SVG)
├── src/
│   ├── defaults.js               # 默认配置项单一数据源 (Single Source of Truth)
│   ├── content.css               # 1:1 ChatGPT 视觉与排版样式表
│   ├── content.js                # 零闪烁首屏缓存、主题自适应监听与 Ctrl+Enter 逻辑
│   └── popup/                    # 极简黑白灰分栏 Popup 控制面板 (HTML/CSS/JS)
├── userscript/
│   └── refined-gemini.user.js    # 同步构建的 Tampermonkey / Violentmonkey 脚本
├── docs/
│   ├── DESIGN_SPEC.md            # 完整 1:1 视觉与交互对齐设计规范
│   └── preview.html              # 零外部依赖的本地交互式对比预览沙盒
└── scripts/
    ├── generate-icons.mjs        # 零依赖 PNG 图标生成脚本
    └── build-userscript.mjs      # 从核心 CSS 自动同步构建油猴脚本
```

## License

[MIT](./LICENSE)
