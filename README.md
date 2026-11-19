# Refined Gemini

**English** · [简体中文](./README.zh-CN.md)

> **Align Google Gemini Web UI 1:1 with ChatGPT Web typography, color surfaces, and clean layout (Manifest V3 Browser Extension & UserScript).**

---

## Overview

**Refined Gemini** replaces Google Gemini's bluish-gray Material surfaces, oversized spacing, cramped/deeply indented lists, and inconsistent dark code shells with a calm, high-contrast reading and writing interface modeled **1:1 on the official ChatGPT Web UI** (`openai/apps-sdk-ui` design tokens).

### Key Improvements

| Dimension | Native Gemini Issue | Refined Gemini (1:1 ChatGPT Alignment) |
| :--- | :--- | :--- |
| **Canvas, Responsive Sidebar & Accent** | Bluish-gray Material tint (`#f0f4f9`), unstyled `320px` `<mat-sidenav>` drawer & focus-ring box below `960px`, harsh royal-blue links | **Light**: `#FFFFFF` canvas, unified `260px` `#F9F9F9` desktop sidebar & small-window drawer (`34px` rows), `#F7F7F8` card, `#ECECEC` active pill<br>**Dark**: `#212121` canvas, `#171717` sidebar/drawer, `#2A2A2A` card, `#2F2F2F` active pill<br>**Brand & Accent**: Preserves colorful top-left Gemini sparkle + ChatGPT **`#0285FF`** circular Send button & primary CTA pills |
| **User Bubbles & File Chips** | Shrink-wrapped flex containers wrap short prompts; `content-visibility: auto` can hide Turn 0; asymmetric file preview radii | Soft-blue **`#E5F3FF` / `#1A3550`** (`--blue-50`) rounded bubbles (`70%` column cap) with crisp `1px`-bordered file/email attachment chips and anti-collapse Turn 0 safeguards |
| **Uniform Typography & Indentation** | Mixed `17px–28px` heading/widget jumps, deep nested list whitespace, forced italic CJK quotes | **100% uniform `16px` (`--rg-font-size`) across headings (`h1`–`h6`), prose, `.gds-*` scales, and custom widget titles** (`600` weight hierarchy); **OpenAI `Markdown.module.css`** list indentation (`0% / 65% / GPT / 125%`) |
| **80+ Unified Widgets & Diagrams** | Unstyled sandboxed diagrams (`<genui-sandbox>` / `<svg-code-block>`), Deep Research plans, Canvas chips, Python execution blocks, audio bars & snackbars | **3-Layer Unified Component Management**: Harmonizes `about:srcdoc`, `*.scf.usercontent.goog` & inline SVG diagrams; unifies Canvas entry chips & split panel, Deep Research / Agent plan cards, `.code-execution-block`, Audio Overview, sources carousel, quizzes & toast snackbars—while **strictly preserving user-authored `<web-preview>` app styles** |
| **Borderless Tables & Code Cards** | Heavy table borders (`173px` min-width), `#141414` black code boxes in Light mode, `46px` headers | Clean `14px` horizontal-rule tables (`0px` flush-left) + unified `#F9F9F9` / `#171717` `12px` code cards (`32px` header, official OpenAI syntax highlighting) |
| **Solid Bottom Composer** | Scrolling chat text peeks beneath the input box or shifts upward on conversation switch | 100% opaque canvas dock shield + `overflow-y: clip` scroll-lock eliminating text bleed and composer jump |

---

### What's New in `v1.9.0` — Message History Navigation

- A subtle rail on the left of the conversation shows a tick for each loaded turn. Hover or focus a tick to preview its prompt and reply; click to jump without moving the composer.
- The current reading position is highlighted. Nearby ticks form a smooth wave as the pointer moves along the rail and return to equal lengths on exit. Arrow keys and Home / End navigate the ticks; Enter jumps and Escape dismisses the preview. Long lists scroll.
- Appears when at least three turns are loaded; hidden below 768px or when the conversation gutter is too narrow. Updates as messages change and follows the extension's master toggle. Older turns appear as Gemini loads them. Excerpts stay in page memory and are never saved or sent elsewhere.

### `v1.10.4` — Model & Thinking Picker

- A compact model list reads the current account’s native menu on every open. Auto stays Auto; versioned model names are preserved without a bundled catalog. An Antigravity-style side submenu lists real thinking levels. Hovering reads that model’s real levels and restores the original selection before presenting them. Clicking a strength commits the model and strength together.
- Tasks show a model-only list when Gemini does not offer thinking levels. Switching between Chat and Tasks keeps the picker working and preserves manual choices.
- Options come from Gemini's current native menu, without hard-coded model IDs, plan upgrades or automatic prompt submission.
- New conversations start on High thinking by default (configurable). Existing conversations and manual choices are preserved. High thinking uses more quota.

### `v1.7.0` — Interaction & Polish

- **Quick toggle `Alt+Shift+G`**: Flip between native Gemini and Refined Gemini instantly for side-by-side comparison, with an in-page confirmation toast and an `OFF` toolbar badge while paused (customizable at `chrome://extensions/shortcuts`; also works in the UserScript).
- **Redesigned popup**: Live status line, semantic option labels (`Standard / Wide / Wider / Fluid` instead of raw pixel values), contextual hover/focus hints in the footer, full keyboard support (ARIA radio groups with arrow keys, visible focus rings), and **Reset with 5-second Undo**.
- **Context-aware notices**: The popup tells you when the current tab isn't Gemini, when a tab needs a reload, or when a local health check detects layout changes. Clicking Report sends only the extension version, selected theme and failed check names to GitHub to prefill an issue; no conversation path or content is included. See [Privacy Policy](./docs/PRIVACY.md).
- **ChatGPT-style pending indicator**: Replaces Gemini's colorful Lottie spinner with a calm pulsing dot aligned to the prose baseline.
- **Block rhythm fixes**: Consistent `12–16px` spacing around tables and code blocks (native Gemini stacks a `40px` gap above code and `0px` above tables).
- **Optional scaled headings** (`scaledHeadings`): `H1–H3` at `1.5 / 1.25 / 1.125×` for long answers; off by default to keep the uniform 16px design.
- **`Ctrl+Enter` discoverability**: When enabled, the composer placeholder shows `· Ctrl+Enter to send` (`⌘+Enter` on macOS).
- **Accessibility**: Unified `#0285FF` `:focus-visible` rings across Gemini controls and `prefers-reduced-motion` support.
- **UserScript parity**: The UserScript now ships the exact same popup as an in-page Shadow DOM settings panel (opened from the userscript manager menu), with cross-tab settings sync.

---

## Streamlined Bilingual Settings (`中文 / EN`)

Click the **Refined Gemini** toolbar icon (or **⚙️ Open settings panel** in your userscript manager menu) to open the settings popup. All changes apply **instantly without reloading**:

- **Language (`中 / EN`)**: Instant UI toggle between Simplified Chinese and English (auto-detects browser language by default).
- **Master Switch**: Toggle styling on/off at any time (reverts host page, inline SVGs, and Generative UI sandbox frames cleanly). Shortcut: `Alt+Shift+G`.
- **Theme (`themeMode`)**: `Auto` / `Light` / `Dark`.
- **Content Width (`chatWidth`)**: `Standard` (768px ChatGPT prose width, default) / `Wide` (920px) / `Wider` (1120px) / `Fluid` (90%).
- **Font Size (`fontSize`)**: `Small` 15px / `Default` 16px (`1.68` line-height) / `Large` 17px.
- **List Indent (`indentScale`)**: `None` / `Compact` (65%) / **`Default`** (ChatGPT) / `Relaxed` (125%).
- **Hide AI Avatar (`hideAvatar`)**: Aligns prose, tables, and code along a single clean left baseline.
- **Compact Sidebar (`compactSidebar`)**: `260px` sidebar width with tight `8px` rounded conversation rows.
- **Clean View (`cleanView`)**: Hides bottom disclaimer text, IP location footer, and upsell/discovery banners while keeping lightweight follow-up cards accessible.
- **Scaled Headings (`scaledHeadings`)**: Progressive `H1–H3` sizes for easier scanning (off by default).
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

# Build store-ready ZIP archive -> dist/refined-gemini-v1.10.4-extension.zip
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
│   ├── defaults.js               # Single Source of Truth: defaults, option sets & normalization
│   ├── background.js             # Service worker: Alt+Shift+G toggle command & OFF badge
│   ├── content.css               # 1:1 ChatGPT Web UI alignment stylesheet
│   ├── content.js                # Zero-FOUC startup cache, sandbox bridge, Ctrl+Enter, toast & health check
│   ├── sandbox.css               # Generative UI SafeContentFrame widget alignment stylesheet
│   ├── sandbox.js                # Reversible SVG/CSS palette & theme sync inside GenUI iframes
│   └── popup/                    # Bilingual (中文 / EN) popup — also reused as the UserScript panel
├── userscript/
│   └── refined-gemini.user.js    # Auto-generated Greasy Fork / ScriptCat UserScript
├── scripts/
│   ├── generate-icons.mjs        # Anti-aliased PNG & 300x300 Edge Store logo generator
│   ├── build-userscript.mjs      # Bundles src/* + popup (Shadow DOM panel) into the UserScript
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
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

## License

[MIT](./LICENSE)
