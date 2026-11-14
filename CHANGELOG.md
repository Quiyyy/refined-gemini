# Changelog

All notable changes to **Refined Gemini** are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.7.0] — 2026-11-14

Interaction, accessibility and polish release. No breaking changes; existing settings are migrated automatically.

### Added
- **Quick toggle command** (`Alt+Shift+G`, customizable at `chrome://extensions/shortcuts`) to flip between native and refined Gemini, with an in-page confirmation toast. The UserScript supports the same shortcut.
- **`OFF` toolbar badge** while styling is paused (new MV3 background service worker `src/background.js`).
- **Scaled headings** option (`scaledHeadings`, off by default): `H1–H3` at `1.5 / 1.25 / 1.125em`.
- **Popup notices**: non-Gemini tab ("Open Gemini"), stale tab opened before install/update ("Reload"), and a local DOM **health check** that offers a prefilled GitHub issue when Gemini's markup drifts.
- **Reset with Undo** (5-second toast).
- **Contextual hints**: hovering or focusing any option shows a one-line explanation in the popup footer.
- **UserScript settings panel**: the extension popup is now bundled verbatim into the UserScript and rendered in a Shadow DOM panel (Trusted Types–safe, closes on `Esc` / outside click), opened from the userscript manager menu. Settings sync across tabs via `GM_addValueChangeListener`.
- `Ctrl+Enter` mode appends `· Ctrl+Enter to send` (`⌘+Enter` on macOS) to the composer placeholder.

### Changed
- **Popup redesign**: live status line, semantic option labels (`Standard / Wide / Wider / Fluid`, `Small / Default / Large`, `None / Compact / Default / Relaxed`), 4px spacing grid, 12px minimum text, paused state remains editable.
- **Pending indicator**: Gemini's Lottie sparkle is replaced by a ChatGPT-style 12px pulsing dot aligned with the prose edge.
- **Block rhythm**: tables now get `8px / 16px` margins (was `0px` above) and code blocks `12px` above (was `40px`).
- `src/defaults.js` is now the single schema for defaults, allowed values, normalization and language resolution across content script, popup, background worker and UserScript.
- Inline SVG diagram harmonization skips work when nothing changed (lower CPU during streaming).

### Accessibility
- Unified `2px #0285FF` `:focus-visible` rings on Gemini controls (inset inside the composer and code cards).
- Popup option groups are ARIA radio groups with roving tabindex and arrow-key navigation; the master switch is a `role="switch"`.
- `prefers-reduced-motion` disables the pending pulse and toast transitions.

### Fixed
- UserScript no longer fails when the manager runs it before `<html>` exists at `document-start`.

### Permissions
- Added `activeTab` (used only to detect whether the current tab is Gemini and to show local status — no page content is read or transmitted). See [PRIVACY.md](./docs/PRIVACY.md).

## [1.6.1] and earlier

See the [commit history](https://github.com/Quiyyy/refined-gemini/commits/main).
