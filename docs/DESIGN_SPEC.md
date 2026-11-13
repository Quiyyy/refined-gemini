# Refined Gemini — 1:1 ChatGPT Web UI Design Specification (`v1.4.1`)

**English** · [简体中文](./DESIGN_SPEC.zh-CN.md)

> [!IMPORTANT]
> **Design Principle**: Rather than inventing arbitrary custom themes, **Refined Gemini** treats the **official ChatGPT Web UI (`openai/apps-sdk-ui`) as its Single Source of Truth** for color primitives, typography, list hierarchy, borderless tables, code cards, and single-left-baseline alignment—exposing only high-utility, zero-clutter user controls.

---

## 1. Visual & Component Token Alignment (`openai/apps-sdk-ui`)

All tokens are derived from OpenAI's official design system (`variables-primitive.css`, `variables-semantic.css`, `Markdown.module.css`, and `CodeBlock.module.css`):

| Layer | Native Gemini Pain Point | Refined Gemini Token & Layout Specification |
| :--- | :--- | :--- |
| **Surfaces & Accents** | Cool blue-gray Material background (`#f0f4f9`), scattered royal-blue buttons | **Light**: Canvas `#FFFFFF`, Sidebar `#F9F9F9`, Active item `#ECECEC`<br>**Dark**: Canvas `#212121`, Sidebar `#171717`, Active item `#2F2F2F`<br>**Accent**: Keeps native colorful top-left Gemini sparkle; applies ChatGPT **`#0285FF`** (`--blue-400`, hover `#0169CC`) to the `32×32` circular Send button & switches |
| **User Bubbles** | Shrink-to-fit flex parents compress percentage `max-width`, wrapping short 10-char messages | Soft-blue **`#E5F3FF` / `#1A3550`** (`--blue-50`), `20px` radius, non-circular `70%` full-column width cap, and `~20px` multi-turn vertical rhythm |
| **Prose & Indentation** | Deeply stacked nested list indentation, blanked `ol > li::marker`, narrow or inconsistent column width | `800px` container = **`768px` (`48rem`)** prose width (`16px` / `1.68` line-height); top-level blocks strictly `0px` collinear; default list indent matches `Markdown.module.css` (`ul/ol` `1.625em`, nested `1.5em`, `li` `0.375em` outside markers) with `0% / 65% / GPT / 125%` presets |
| **Markdown Tables** | `min-width: 173px` per cell causing fake horizontal scrollbars, double borders, `17px` oversized text | Clean `14px` horizontal-rule tables (`min-width: 0`), `600` bold header row, no bottom border on final row, `0px` left padding on first column |
| **Code Blocks & Inline Code** | Forced `#141414` dark boxes in Light mode, `46px` header creating excessive gap above first line | Unified `#F9F9F9` / `#171717` `12px` card, `32px` compact header (`26×26` icon buttons), `14px/1.5` monospace with OpenAI syntax colors (`#0169cc`/`#66b5ff`, `#c0660d`/`#ffe48c`, `#008635`/`#40c977`, `#8046d9`/`#ad7bf9`); inline code pill with `1px` inset ring |
| **Bottom Composer Dock** | Scrolling text peeks below `.text-input-field` or ghosts behind semi-transparent top gradients | Flush-top 100% opaque `--rg-bg-canvas` dock + `::after` viewport shield with `136px` final-turn scroll clearance |

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
