# Refined Gemini

[English](./README.md) · **简体中文**

> **1:1 对齐 ChatGPT 网页端视觉与排版基准的 Google Gemini 浏览器扩展（Manifest V3）与油猴脚本（UserScript）。**

---

## 一、 核心改进概览（`v1.4.0`）

以 OpenAI 官方开源组件库（`openai/apps-sdk-ui`）的设计 Token 与排版规范为唯一基准，彻底解决原生 Gemini 网页端的阅读与交互痛点：

| 维度 | Gemini 原生痛点 | `Refined Gemini` 对齐 ChatGPT 后的表现 |
| :--- | :--- | :--- |
| **画布、侧栏与强调色** | 泛冷蓝灰 Material 底色（`#f0f4f9`）、杂乱皇家蓝控件 | **浅色**：画布 `#FFFFFF`、侧栏 `#F9F9F9`、选中项 `#ECECEC`<br>**深色**：画布 `#212121`、侧栏 `#171717`、选中项 `#2F2F2F`<br>**品牌与强调色**：保留左上 Gemini 彩色极光星标，接入 ChatGPT **`#0285FF`** 蓝色圆形发送按钮与面板开关 |
| **浅蓝用户气泡与防折行** | 嵌套弹性容器百分比回环导致 10 字短句被强行折成两行 | 采用 `--blue-50` **浅蓝用户气泡**（浅色 `#E5F3FF` / 深色 `#1A3550`，`20px` 圆角），按完整对话列宽 `70%` 计算上限；多轮间距紧凑收敛至 `~20px` |
| **可配置列表缩进比例** | 多级列表层层叠加过深空白、`ol` 序号丢失、中文引用强制斜体 | **默认 1:1 对齐 OpenAI `Markdown.module.css`**（一级 `1.625em` / 子级 `1.5em` / `li` `0.375em` 外置悬挂标号 `• ◦ ▪` 与 `1. 2. 3.`），支持 **`0% / 65% / 标准 GPT / 125%`** 四档实时切换；一级标题/段落/表格/代码块严格 `0px` 共线 |
| **无竖框 Markdown 表格** | 厚重外框、强制 `min-width: 173px` 触发假横向滚动条 | 极简 `14px` 无竖框横线表，表头 `600` 粗体，首列 `padding-left: 0` 与正文左边缘严格共线 |
| **紧凑代码块卡片** | 浅色模式强套 `#141414` 黑底、顶栏 `46px` 虚高导致语言名距代码过远 | 一体化 `#F9F9F9` / `#171717` `12px` 圆角卡片，`32px` 紧凑顶栏 + OpenAI 官方语法高亮色板 |
| **防透字底部输入舱** | 滚动时文字从输入框下方露头或在顶部渐变区半透明穿模 | 100% 纯色不透明画布底座遮罩，彻底消除输入框下方露字与上方残影 |

---

## 二、 极简双语设置面板（`中 / EN`）

点击浏览器工具栏的 **Refined Gemini** 图标即可打开无冗余文字说明的精简设置面板，所有选项**实时生效，无需刷新页面**：

- **界面语言（`中 / EN`）**：支持一键切换简体中文与英文界面（首次默认自动跟随浏览器语言）。
- **总开关**：随时一键开启或暂停美化，即时对比原生 Gemini。
- **外观（`themeMode`）**：`跟随` / `浅色` / `深色`。
- **列宽（`chatWidth`）**：`768px`（默认，1:1 对齐 ChatGPT `48rem` 正文列宽）/ `920px` / `1120px` / `90%`。
- **字号（`fontSize`）**：`15px` / `16px`（默认，行高 `1.68`）/ `17px`。
- **缩进（`indentScale`）**：`0%` / `65%` / **`标准 GPT`（默认）** / `125%`。
- **隐藏 AI 头像（`hideAvatar`）**：正文、表格与代码块沿同一左基准线直排。
- **紧凑侧边栏（`compactSidebar`）**：`260px` 侧栏宽度配紧凑圆角会话行。
- **纯净模式（`cleanView`）**：隐藏底部免责声明、IP 定位栏、升级推广徽章与末尾追问建议气泡。
- **`Ctrl / ⌘ + Enter` 发送（`ctrlEnterSend`）**：单按 `Enter` 仅换行（兼容中文输入法候选上屏），防长 Prompt 误触发送。

---

## 三、 安装方式

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

## 四、 本地构建与商店打包

本项目**零第三方依赖**（仅使用 Node.js 18+ 内置标准库）：

```bash
# 重新生成多尺寸图标（含 Edge 商店所需的 300x300 徽标）并同步构建油猴脚本
npm run build

# 检查所有扩展与油猴脚本 JS 语法
npm run check

# 一键打包符合 Edge / Chrome 扩展商店规范的纯净上传包 -> dist/refined-gemini-v1.4.0-extension.zip
npm run pack
```

---

## 五、 项目目录结构

```text
refined-gemini/
├── manifest.json                 # Chrome / Edge Manifest V3 扩展清单（最小权限仅 storage）
├── package.json                  # 标准化构建、语法校验与商店 ZIP 打包脚本
├── _locales/                     # WebExtension 标准多语言包 (en, zh_CN)
├── icons/                        # SVG 矢量源文件与超采样抗锯齿图标 (16/32/48/128px)
├── src/
│   ├── defaults.js               # 默认配置项单一数据源 (Single Source of Truth)
│   ├── content.css               # 1:1 ChatGPT 视觉与排版核心样式表
│   ├── content.js                # 首屏零闪烁缓存、主题跟随监听与 Ctrl+Enter 发送
│   └── popup/                    # 精简无冗余说明的中英双语 Popup 控制面板
├── userscript/
│   └── refined-gemini.user.js    # 符合 Greasy Fork / ScriptCat 规范的双语油猴脚本
├── scripts/
│   ├── generate-icons.mjs        # 零依赖 PNG 图标与 300x300 商店徽标生成脚本
│   ├── build-userscript.mjs      # 从核心 CSS 自动同步构建油猴脚本
│   └── pack-extension.mjs        # 一键生成商店上传专用 ZIP 压缩包
└── docs/
    ├── DESIGN_SPEC.zh-CN.md      # 视觉与排版设计规范（中文 / English）
    ├── PUBLISHING.zh-CN.md       # Edge 扩展商店与油猴市场上架完整指南
    ├── PRIVACY.md                # 中英双语隐私权政策（商店审核必填链接）
    └── preview.html              # 本地零依赖交互式对比预览沙盒
```

## 六、 相关文档

- **上架发布指南（Edge 插件商店 & 油猴脚本市场）**：[简体中文](./docs/PUBLISHING.zh-CN.md) · [English](./docs/PUBLISHING.md)
- **视觉与排版设计规范**：[简体中文](./docs/DESIGN_SPEC.zh-CN.md) · [English](./docs/DESIGN_SPEC.md)
- **隐私政策声明**：[PRIVACY.md](./docs/PRIVACY.md)

## License

[MIT](./LICENSE)
