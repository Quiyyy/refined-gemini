# Refined Gemini

**English** · [简体中文](./README.zh-CN.md)

> **Align Google Gemini Web UI 1:1 with ChatGPT Web typography, color surfaces, and clean layout (Manifest V3 Browser Extension & UserScript).**

---

## Overview

**Refined Gemini** replaces Google Gemini's bluish-gray Material surfaces, oversized spacing, cramped/deeply indented lists, and inconsistent dark code shells with a calm, high-contrast reading and writing interface modeled **1:1 on the official ChatGPT Web UI** (`openai/apps-sdk-ui` design tokens).

### Key Improvements (`v1.5.1`)

| Dimension | Native Gemini Issue | Refined Gemini (1:1 ChatGPT Alignment) |
| :--- | :--- | :--- |
| **Canvas, Sidebar & Accent** | Bluish-gray Material tint (`#f0f4f9`), visual clutter, harsh royal-blue links | **Light**: `#FFFFFF` canvas, `#F9F9F9` sidebar, `#ECECEC` active pill<br>**Dark**: `#212121` canvas, `#171717` sidebar, `#2F2F2F` active pill<br>**Brand & Accent**: Preserves colorful top-left Gemini sparkle + ChatGPT **`#0285FF`** circular Send button & switches |
| **User Message Bubbles** | Shrink-wrapped flex containers wrap short prompts; `content-visibility: auto` can hide Turn 0 | Soft-blue **`#E5F3FF` / `#1A3550`** (`--blue-50`) rounded bubbles sized to `70%` of the full chat column, with anti-collapse visibility safeguards on Turn 0 |
| **Uniform Typography & Indentation** | Mixed `17px–22px` heading/intro jumps, deep nested list whitespace, forced italic CJK quotes | **100% uniform `16px` (`--rg-font-size`) across headings (`h1`–`h6`), prose, and GenUI intros** (headings distinguished strictly by `600` weight & spacing); **OpenAI `Markdown.module.css`** list indentation with **`0% / 65% / GPT / 125%`** presets |
| **GenUI Diagrams & Follow-Up Cards** | Unstyled sandboxed diagrams (`<genui-sandbox>` `about:srcdoc` & `SafeContentFrame`) & chunky borderless follow-up blocks | Harmonizes both Angular `<gen-ui-html>` / `<genui-sandbox>` (`about:srcdoc` opaque origin) and cross-origin `SafeContentFrame` (`*.scf.usercontent.goog`) interactive diagrams with ChatGPT Light/Dark palettes & uniform `16px` titles, and redraws follow-up prompts into lightweight `1px`-bordered `12px`-radius cards |
| **Borderless Tables & Code Cards** | Heavy table borders (`173px` min-width), `#141414` black code boxes in Light mode, `46px` headers | Clean `14px` horizontal-rule tables (`0px` flush-left) + unified `#F9F9F9` / `#171717` `12px` code cards (`32px` header, official OpenAI syntax highlighting) |
| **Solid Bottom Composer** | Scrolling chat text peeks beneath the input box or shifts upward on conversation switch | 100% opaque canvas dock shield + `overflow-y: clip` scroll-lock eliminating text bleed and composer jump |

---

## Streamlined Bilingual Settings (`中文 / EN`)

Click the **Refined Gemini** toolbar icon to open the clutter-free settings popup. All changes apply **instantly without reloading**:

- **Language (`中 / EN`)**: Instant UI toggle between Simplified Chinese and English (auto-detects browser language by default).
- **Master Switch**: Toggle styling on/off at any time (reverts both host page and Generative UI sandbox frames cleanly).
- **Theme (`themeMode`)**: `Auto` / `Light` / `Dark`.
- **Width (`chatWidth`)**: `768px` (default `48rem` ChatGPT prose width) / `920px` / `1120px` / `90%`.
- **Font Size (`fontSize`)**: `15px` / `16px` (default, `1.68` line-height) / `17px`.
- **Indent (`indentScale`)**: `0%` / `65%` / **`GPT` (default)** / `125%`.
- **Hide AI Avatar (`hideAvatar`)**: Aligns prose, tables, and code along a single clean left baseline.
- **Compact Sidebar (`compactSidebar`)**: `260px` sidebar width with tight `8px` rounded conversation rows.
- **Clean View (`cleanView`)**: Hides bottom disclaimer text, IP location footer, and upsell badges while keeping lightweight follow-up cards accessible.
- **`Ctrl / ⌘ + Enter` to Send (`ctrlEnterSend`)**: Plain `Enter` inserts a newline (IME-safe); `Ctrl/⌘ + Enter` submits.

---

## Installation

### Option A: Chrome / Edge / Brave / Arc Extension (Unpacked)

1. Clone this repository:
   ```bash
   git clone https://github.com/Quiyyy/refined-gemini.git
   ```
2. Open `chrome://extensions` (or `edge://extensions` in Microsoft Edge).
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `refined-gemini` root folder.

### Option B: Tampermonkey / Violentmonkey / ScriptCat UserScript

1. Install [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [ScriptCat](https://scriptcat.org/).
2. Open the raw script URL to trigger one-click installation:
   `https://raw.githubusercontent.com/Quiyyy/refined-gemini/main/userscript/refined-gemini.user.js`

---

## Development & Packaging

Zero external npm dependencies are required (Node.js 18+ built-in modules only):

```bash
# Regenerate PNG icons (16/32/48/128px + 300px store logo) and UserScript
npm run build

# Syntax-check all extension & UserScript JavaScript files
npm run check

# Build store-ready ZIP archive -> dist/refined-gemini-v1.5.1-extension.zip
npm run pack
```

---

## Project Structure

```text
refined-gemini/
├── manifest.json                 # Chrome / Edge Manifest V3 configuration (host + GenUI sandbox frames)
├── package.json                  # Zero-dependency build, check, and store packaging scripts
├── _locales/                     # WebExtension i18n bundles (en, zh_CN)
├── icons/                        # Vector SVG & supersampled PNG icons (16/32/48/128px)
├── src/
│   ├── defaults.js               # Single Source of Truth for default settings
│   ├── content.css               # 1:1 ChatGPT Web UI alignment stylesheet
│   ├── content.js                # Zero-FOUC startup cache, sandbox postMessage bridge & Ctrl+Enter
│   ├── sandbox.css               # Generative UI SafeContentFrame widget alignment stylesheet
│   ├── sandbox.js                # Reversible SVG/CSS palette & theme sync inside GenUI iframes
│   └── popup/                    # Streamlined bilingual (中文 / EN) Popup UI
├── userscript/
│   └── refined-gemini.user.js    # Auto-generated Greasy Fork / ScriptCat UserScript
├── scripts/
│   ├── generate-icons.mjs        # Anti-aliased PNG & 300x300 Edge Store logo generator
│   ├── build-userscript.mjs      # Syncs src/content.css & src/sandbox.css into bilingual UserScript
│   └── pack-extension.mjs        # Builds clean store ZIP into dist/
└── docs/
    ├── DESIGN_SPEC.md            # Visual & typographic specification (English / 中文)
    ├── PUBLISHING.md             # Edge Add-ons & Greasy Fork / ScriptCat publishing guide
    ├── PRIVACY.md                # Bilingual Privacy Policy (zero data collection)
    └── preview.html              # Self-contained local interactive comparison sandbox
```

## Documentation

- **Publishing Guide (Edge Add-ons & Tampermonkey Stores)**: [English](./docs/PUBLISHING.md) · [简体中文](./docs/PUBLISHING.zh-CN.md)
- **Design Specification**: [English](./docs/DESIGN_SPEC.md) · [简体中文](./docs/DESIGN_SPEC.zh-CN.md)
- **Privacy Policy**: [PRIVACY.md](./docs/PRIVACY.md)

## License

[MIT](./LICENSE)
