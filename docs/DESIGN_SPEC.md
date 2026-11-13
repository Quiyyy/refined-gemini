# Refined Gemini — 1:1 ChatGPT Web UI Design Specification (`v1.5.1`)

**English** · [简体中文](./DESIGN_SPEC.zh-CN.md)

> [!IMPORTANT]
> **Design Principle**: Rather than inventing arbitrary custom themes, **Refined Gemini** treats the **official ChatGPT Web UI (`openai/apps-sdk-ui`) as its Single Source of Truth** for color primitives, typography, list hierarchy, borderless tables, code cards, follow-up cards, and Generative UI sandbox widgets—exposing only high-utility, zero-clutter user controls.

---

## 1. Visual & Component Token Alignment (`openai/apps-sdk-ui`)

All tokens are derived from OpenAI's official design system (`variables-primitive.css`, `variables-semantic.css`, `Markdown.module.css`, and `CodeBlock.module.css`):

| Layer | Native Gemini Pain Point | Refined Gemini Token & Layout Specification |
| :--- | :--- | :--- |
| **Surfaces & Accents** | Cool blue-gray Material background (`#f0f4f9`), scattered royal-blue buttons | **Light**: Canvas `#FFFFFF`, Sidebar `#F9F9F9`, Active item `#ECECEC`<br>**Dark**: Canvas `#212121`, Sidebar `#171717`, Active item `#2F2F2F`<br>**Accent**: Keeps native colorful top-left Gemini sparkle; applies ChatGPT **`#0285FF`** (`--blue-400`, hover `#0169CC`) to the `32×32` circular Send button & switches |
| **User Bubbles & Turn 0 Guard** | Shrink-to-fit flex parents wrap short prompts; `content-visibility: auto` can hide Turn 0 | Soft-blue **`#E5F3FF` / `#1A3550`** (`--blue-50`), `20px` radius, non-circular `70%` full-column width cap, `content-visibility: visible` safeguard on Turn 0 |
| **Uniform `16px` Prose & Headings** | Mixed `17px–22px` heading/intro jumps, deep nested list whitespace, blanked `ol` markers | `800px` container = **`768px` (`48rem`)** prose width; **`h1`–`h6`, prose, and non-`.markdown` GenUI intros strictly share `var(--rg-font-size, 16px)`** (`600` weight + spacing hierarchy on headings); `0% / 65% / GPT / 125%` list indentation presets |
| **GenUI Sandbox & Follow-Up Cards** | Opaque `about:srcdoc` `<genui-sandbox>` & cross-origin `SafeContentFrame` diagrams (`#3186ff` / `#f2f0f0`) & chunky borderless follow-up blocks | Subframe `sandbox.css` + `sandbox.js` (`match_origin_as_fallback` on `about:srcdoc` + `*.scf.usercontent.goog`) synchronizes Light/Dark ChatGPT palettes, interactive step states, and uniform `16px` titles with lossless toggle revert; redraws `[data-testid="elicitation"]` follow-up prompts as `1px`-bordered `12px`-radius cards |
| **Markdown Tables** | `min-width: 173px` per cell causing fake horizontal scrollbars, double borders, `17px` oversized text | Clean `14px` horizontal-rule tables (`min-width: 0`), `600` bold header row, no bottom border on final row, `0px` left padding on first column |
| **Code Blocks & Inline Code** | Forced `#141414` dark boxes in Light mode, `46px` header creating excessive gap above first line | Unified `#F9F9F9` / `#171717` `12px` card, `32px` compact header (`26×26` icon buttons), `14px/1.5` monospace with OpenAI syntax colors; inline code pill with `1px` inset ring |
| **Bottom Composer Dock** | Scrolling text peeks below `.text-input-field` or shifts upward during conversation switches | Flush-top 100% opaque `--rg-bg-canvas` dock + `.chat-container` `overflow-y: clip` scroll-lock with `136px` final-turn scroll clearance |

---

## 2. Minimalist Bilingual Controls (`中文 / EN`)

To keep cognitive load near zero, all verbose explanatory subtitles were removed from the Popup in `v1.4.0`:

1. **Language (`uiLang`)**: `中` / `EN` (defaults to `auto` based on `navigator.language`).
2. **Master Toggle (`enabled`)**: Instant live toggle without page reload.
3. **Theme (`themeMode`)**: `Auto` / `Light` / `Dark`.
4. **Width (`chatWidth`)**: `768px` (default) / `920px` / `1120px` / `90%`.
5. **Font Size (`fontSize`)**: `15px` / `16px` (default) / `17px`.
6. **Indent (`indentScale`)**: `0%` / `65%` / `GPT` (default) / `125%`.
7. **Switches**: `Hide AI Avatar`, `Compact Sidebar`, `Clean View`, and `Ctrl/⌘ + Enter to Send`.

> [!TIP]
> **Icon & Math Font Isolation**: Global typography rules explicitly preserve `mat-icon`, `.google-symbols`, `Material Symbols Outlined`, and `KaTeX` font families so UI ligature icons and mathematical formulas never break.
