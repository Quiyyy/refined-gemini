# Refined Gemini — 1:1 ChatGPT Web UI Design Specification (`v1.6.0`)

**English** · [简体中文](./DESIGN_SPEC.zh-CN.md)

> [!IMPORTANT]
> **Design Principle**: Rather than inventing arbitrary custom themes, **Refined Gemini** treats the **official ChatGPT Web UI (`openai/apps-sdk-ui`) as its Single Source of Truth** for color primitives, typography, list hierarchy, borderless tables, code cards, all 80+ Gemini custom widgets, and Generative UI sandbox diagrams—exposing only high-utility, zero-clutter user controls.

---

## 1. Visual & Component Token Alignment (`openai/apps-sdk-ui`)

All tokens are derived from OpenAI's official design system (`variables-primitive.css`, `variables-semantic.css`, `Markdown.module.css`, and `CodeBlock.module.css`):

| Layer | Native Gemini Pain Point | Refined Gemini Token & Layout Specification |
| :--- | :--- | :--- |
| **Surfaces & Accents** | Cool blue-gray Material background (`#f0f4f9`), scattered royal-blue buttons | **Light**: Canvas `#FFFFFF`, Sidebar `#F9F9F9`, Card `#F7F7F8`, Active `#ECECEC`<br>**Dark**: Canvas `#212121`, Sidebar `#171717`, Card `#2A2A2A`, Active `#2F2F2F`<br>**Accent**: Keeps native colorful top-left Gemini sparkle; applies ChatGPT **`#0285FF`** (`--blue-400`, hover `#0169CC`) to the circular Send button, primary CTA pills & switches |
| **User Bubbles & File Chips** | Shrink-to-fit flex parents wrap short prompts; `content-visibility: auto` can hide Turn 0; asymmetric file thumbnail radii | Soft-blue **`#E5F3FF` / `#1A3550`** (`--blue-50`), `20px` radius, `70%` column width cap, crisp `1px`-bordered file/email attachment chips, and `content-visibility: visible` safeguard on Turn 0 |
| **Uniform `16px` Prose & Headings** | Mixed `17px–28px` heading/`.gds-*`/widget jumps, deep nested list whitespace, blanked `ol` markers | `800px` container = **`768px` (`48rem`)** prose width; **`h1`–`h6`, prose, GenUI intros, and `.gds-*` turn widget titles strictly share `var(--rg-font-size, 16px)`** (`600` weight hierarchy); `0% / 65% / GPT / 125%` list indentation presets |
| **80+ Unified Widgets & Sandboxes** | Opaque `about:srcdoc` `<genui-sandbox>`, `<svg-code-block>`, Deep Research cards, Canvas chips, Python `.code-execution-block`, `32px` audio player & inverse snackbars | **3-Layer Management**: (1) Universal `response-element` font & `16px` cap; (2) `1px` `12px–14px` cards across Canvas chips/split panel, Deep Research & Agent plans, `.code-execution-block`, sources carousel, quizzes, Audio Overview & toast snackbars; (3) Sandbox + inline SVG harmonization with **explicit `<web-preview>` whitelist preserving user-authored web apps** |
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
