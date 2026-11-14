# Refined Gemini — 1:1 ChatGPT Web UI Design Specification (`v1.7.0`)

**English** · [简体中文](./DESIGN_SPEC.zh-CN.md)

> [!IMPORTANT]
> **Design Principle**: Rather than inventing arbitrary custom themes, **Refined Gemini** treats the **official ChatGPT Web UI (`openai/apps-sdk-ui`) as its Single Source of Truth** for color primitives, typography, list hierarchy, borderless tables, code cards, all 80+ Gemini custom widgets, and Generative UI sandbox diagrams—exposing only high-utility, zero-clutter user controls.

---

## 1. Visual & Component Token Alignment (`openai/apps-sdk-ui`)

All tokens are derived from OpenAI's official design system (`variables-primitive.css`, `variables-semantic.css`, `Markdown.module.css`, and `CodeBlock.module.css`):

| Layer | Native Gemini Pain Point | Refined Gemini Token & Layout Specification |
| :--- | :--- | :--- |
| **Surfaces, Responsive Sidebar & Accents** | Cool blue-gray Material background (`#f0f4f9`), unstyled `320px` `<mat-sidenav>` drawer & CDK focus box below `960px`, scattered royal-blue buttons | **Light**: Canvas `#FFFFFF`, unified `260px` `#F9F9F9` desktop `<bard-sidenav>` & small-window `<mat-sidenav>` drawer (`34px` rows, `13.5px` text, `8px` capsules & hairline footer divider), Card `#F7F7F8`, Active `#ECECEC`<br>**Dark**: Canvas `#212121`, Sidebar/Drawer `#171717`, Card `#2A2A2A`, Active `#2F2F2F`<br>**Accent**: Keeps native colorful top-left Gemini sparkle; applies ChatGPT **`#0285FF`** (`--blue-400`, hover `#0169CC`) to the circular Send button, primary CTA pills & switches |
| **User Bubbles & File Chips** | Shrink-to-fit flex parents wrap short prompts; `content-visibility: auto` can hide Turn 0; asymmetric file thumbnail radii | Soft-blue **`#E5F3FF` / `#1A3550`** (`--blue-50`), `20px` radius, `70%` column width cap, crisp `1px`-bordered file/email attachment chips, and `content-visibility: visible` safeguard on Turn 0 |
| **Uniform `16px` Prose & Headings** | Mixed `17px–28px` heading/`.gds-*`/widget jumps, deep nested list whitespace, blanked `ol` markers | `800px` container = **`768px` (`48rem`)** prose width; **`h1`–`h6`, prose, GenUI intros, and `.gds-*` turn widget titles strictly share `var(--rg-font-size, 16px)`** (`600` weight hierarchy); `0% / 65% / GPT / 125%` list indentation presets |
| **80+ Unified Widgets & Sandboxes** | Opaque `about:srcdoc` `<genui-sandbox>`, `<svg-code-block>`, Deep Research cards, Canvas chips, Python `.code-execution-block`, `32px` audio player & inverse snackbars | **3-Layer Management**: (1) Universal `response-element` font & `16px` cap; (2) `1px` `12px–14px` cards across Canvas chips/split panel, Deep Research & Agent plans, `.code-execution-block`, sources carousel, quizzes, Audio Overview & toast snackbars; (3) Sandbox + inline SVG harmonization with **explicit `<web-preview>` whitelist preserving user-authored web apps** |
| **Markdown Tables** | `min-width: 173px` per cell causing fake horizontal scrollbars, double borders, `17px` oversized text | Clean `14px` horizontal-rule tables (`min-width: 0`), `600` bold header row, no bottom border on final row, `0px` left padding on first column |
| **Code Blocks & Inline Code** | Forced `#141414` dark boxes in Light mode, `46px` header creating excessive gap above first line | Unified `#F9F9F9` / `#171717` `12px` card, `32px` compact header (`26×26` icon buttons), `14px/1.5` monospace with OpenAI syntax colors; inline code pill with `1px` inset ring |
| **Bottom Composer Dock** | Scrolling text peeks below `.text-input-field` or shifts upward during conversation switches | Flush-top 100% opaque `--rg-bg-canvas` dock + `.chat-container` `overflow-y: clip` scroll-lock with `136px` final-turn scroll clearance |

---

## 2. Bilingual Controls & Interaction (`中文 / EN`, `v1.7.0`)

The popup stays free of permanent explanatory text; context is revealed only on demand (hover / keyboard focus shows a one-line hint in the footer). Option labels are semantic rather than raw values:

1. **Language (`uiLang`)**: `中` / `EN` (defaults to `auto` based on `navigator.language`).
2. **Master Toggle (`enabled`)**: Instant live toggle without page reload; global shortcut **`Alt+Shift+G`** (in-page toast + `OFF` toolbar badge while paused).
3. **Theme (`themeMode`)**: `Auto` / `Light` / `Dark`.
4. **Content Width (`chatWidth`)**: `Standard` 768px (default) / `Wide` 920px / `Wider` 1120px / `Fluid` 90%.
5. **Font Size (`fontSize`)**: `Small` 15px / `Default` 16px / `Large` 17px.
6. **List Indent (`indentScale`)**: `None` 0% / `Compact` 65% / `Default` GPT / `Relaxed` 125%.
7. **Switches**: `Hide AI Avatar`, `Compact Sidebar`, `Clean View`, `Scaled Headings` (opt-in `H1–H3` = `1.5 / 1.25 / 1.125em`), and `Ctrl/⌘ + Enter to Send` (adds `· Ctrl+Enter to send` to the composer placeholder).
8. **Notices**: Non-Gemini tab → "Open Gemini"; tab opened before install/update → "Reload"; local DOM health check failure → prefilled issue report.
9. **Reset**: Restores defaults with a 5-second **Undo** toast.

**Interaction tokens**: 4px spacing grid, `12px` minimum text, `2px #0285FF` `:focus-visible` ring (inset inside the composer & code cards), ARIA radio groups with roving tabindex, `prefers-reduced-motion` respected. The pending state uses a `12px` ChatGPT-style pulsing dot aligned to the prose left edge instead of the Lottie sparkle. Block rhythm: tables `8px / 16px`, code cards `12px` above / `16px` below.

> [!TIP]
> **Icon & Math Font Isolation**: Global typography rules explicitly preserve `mat-icon`, `.google-symbols`, `Material Symbols Outlined`, and `KaTeX` font families so UI ligature icons and mathematical formulas never break.
