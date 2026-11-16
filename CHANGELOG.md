# Changelog

All notable changes to **Refined Gemini** are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.8.4] — 2026-11-16

### Fixed
- Show a compact model-only list when Gemini Tasks does not expose thinking levels, instead of falling back to the original menu.
- Cancel pending menu reads and selections when switching between Chat and Tasks or navigating to another page, then read the current controls afresh.
- Preserve each mode's manual thinking selection when returning from another mode; new conversations still default to High where available.

## [1.8.3] — 2026-11-16

### Fixed
- Support Gemini's narrow-screen gem-button trigger and inline thinking-level expansion, as well as the desktop submenu.
- Close the custom picker immediately on selection. Let Gemini finish menu teardown before reopening and use native checked states when toolbar text omits thinking strength.
- Restore default High thinking on new chats, including the new-chat logo link.

### Validation
- On the signed-in Gemini site, the same content scripts passed 36 desktop and 36 narrow-layout model/level switches with no errors; every custom picker closed synchronously. Measured selection time was 24–221 ms in this run.
- A manual Low choice remained Low; starting a new conversation selected High. These were isolated page-debugging tests, not a permanent extension installation in the in-app browser.

## [1.8.2] — 2026-11-16

### Fixed
- Wait for Gemini's model menu to finish closing and the new model to appear before selecting its thinking level.
- Reacquire rebuilt composer controls, observe text-node updates, and confirm the live model/level before showing a failure notice.
- Open native menus after the custom choice click finishes, avoiding conflicts with outside-click handlers.

## [1.8.1] — 2026-11-16

### Changed
- Replaced the model matrix with the selected lightweight list design: model names with subtle version labels, quiet inline thinking choices, a neutral filled selection, and more natural spacing. One-click model/thinking selection and new-chat High defaults are unchanged.

## [1.8.0] — 2026-11-16

### Added
- A compact model × Low/Medium/High picker: choose both in one click, using Gemini's live model list and native controls without changing subscriptions or sending prompts.
- New conversations default to High thinking, with an opt-out in settings. Existing conversations, manual selections and active drafts are preserved; an empty autofocused editor gets its focus restored after initialization.

## [1.7.1] — 2026-11-16

### Fixed
- Feedback links no longer include Gemini conversation paths or browser user-agent strings. Privacy disclosures now explain which diagnostics are sent when the GitHub page opens.
- The UserScript settings panel can open feedback links without requiring the extension-only tabs API.
- Inline SVG recoloring is invalidated by actual DOM changes, including equal-size node replacements, fill/stroke updates and stylesheet text changes, rather than node counts.

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
