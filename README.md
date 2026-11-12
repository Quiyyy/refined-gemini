# Refined Gemini

> **1:1 对齐 ChatGPT 网页端视觉与排版基准的 Google Gemini 浏览器扩展（Manifest V3 & UserScript）**

**核心设计准则**：放弃花哨的主观自创主题与复杂装饰，以 **ChatGPT 网页端成熟克制的视觉与排版体系作为唯一基准（Single Source of Truth）**，全面对齐字体、配色、缩进、无竖框表格、柔和圆角代码卡片与单左基准线页面布局；在此之上仅提供高实用价值、零认知负担的可选配置项。

---

## 一、 视觉与排版 1:1 对齐拆解

| 维度 | Gemini 原生痛点 | `refined-gemini` 对齐 ChatGPT 后的表现 |
| :--- | :--- | :--- |
| **画布与侧栏配色** | 泛冷蓝灰的 Material 底色（`#f0f4f9`），上下带有发灰的渐变遮罩 | **浅色**：主画布纯白 `#FFFFFF`，侧边栏浅中性灰 `#F9F9F9`，选中胶囊 `#ECECEC`<br>**深色**：主画布 `#212121`，侧边栏 `#171717`，选中胶囊 `#2F2F2F`；彻底清除渐变遮罩 |
| **中英正文字体与字重** | 强绑 `Google Sans`，中英混排字重脱节，粗体辨识度弱 | 系统现代无衬线栈（`-apple-system` / `Segoe UI` / `PingFang SC` / `Microsoft YaHei`），默认 `16px`、行高 `1.72`；`<strong>` 扎实 `600` 字重 + 纯黑/纯白高对比 |
| **Markdown 表格** | 厚重圆角外框、灰色表头块、左右额外内边距导致与正文错位 | **极简无竖框横线表**：零外框、零背景色，表头 `600` 粗体配清晰底线，行间极淡 `1px` 分隔线；**首列 `padding-left: 0` 与正文左边线严丝合缝对齐** |
| **代码块与行内代码** | 顶栏与代码区割裂，行内代码底色模糊 | **柔和一体化圆角卡片**（浅色 `#F9F9F9` / 深色 `#171717`，`12px` 圆角），`</> 语言` 顶栏与主体同色融合；行内代码 `` `session_id` `` 采用 `#ECECEC` / `#2F2F2F` 紧凑圆角底 |
| **段落、列表与公式缩进** | 嵌套列表行距松散，单屏有效信息量少 | 段落底距 `1rem`，列表左缩进 `1.5rem`、项间距紧凑 `0.3rem`，块级 KaTeX 公式居中舒展留白 |
| **回复流布局与输入框** | 每轮左侧挂星形头像挤占列宽；底部输入框带阴影遮罩与免责小字 | 默认隐藏 AI 头像，正文/表格/代码一气呵成沿左基准线直排；底部改为纯白/深灰悬浮胶囊（`1px` 细边框 + 微柔漫反射阴影） |

---

## 二、 可选配置面板（零设计负担）

点击浏览器工具栏的 **Refined Gemini** 图标，即可打开同样采用 ChatGPT 极简黑白灰分栏风格的设置面板（所有修改无需刷新页面，**实时生效**）：

1. **总开关（Master Toggle）**：一键实时开启/暂停美化，随时对比原生 Gemini 效果。
2. **外观配色（`themeMode`）**：`跟随页面（默认）` / `浅色` / `深色`。
3. **对话列宽度（`chatWidth`）**：`标准 768px（默认，1:1 对齐 ChatGPT）` / `适中 920px` / `宽屏 1120px` / `超宽 90%`（遇到超多列宽表或长代码时一键展开）。
4. **正文字号密度（`fontSize`）**：`紧凑 15px` / `标准 16px（默认）` / `宽松 17px`。
5. **隐藏 AI 回复头像（`hideAvatar`，默认开启）**：对齐 ChatGPT 无头像左基准线直排；若习惯保留 Gemini 星标可随时关闭。
6. **紧凑侧边栏（`compactSidebar`，默认开启）**：将展开态侧栏收敛至 ChatGPT 同款 `260px` 定宽与 `8px` 圆角紧凑会话行（保留原生折叠窄栏能力）。
7. **纯净降噪模式（`cleanView`，默认开启）**：隐藏底部免责声明、IP 定位栏、Upgrade 推广按钮与回答末尾追问建议气泡。
8. **`Ctrl / ⌘ + Enter` 发送（`ctrlEnterSend`，默认关闭）**：开启后单按 `Enter` 仅换行（兼容中文输入法候选上屏），防止撰写多段结构化 Prompt 时误触发送。

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

如果你使用 Firefox / Safari 或偏好油猴脚本管理，可直接打开并安装仓库内的 [`userscript/refined-gemini.user.js`](./userscript/refined-gemini.user.js)，支持通过油猴菜单一键切换开关、列宽与配色。

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
