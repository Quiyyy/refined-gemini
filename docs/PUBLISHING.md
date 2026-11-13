# Publishing Guide: Microsoft Edge Add-ons & UserScript Stores

**English** · [简体中文](./PUBLISHING.zh-CN.md)

This repository is pre-configured for store submission out of the box—complete with WebExtension `_locales/` bundles, a pre-rendered `300×300` store logo, a bilingual Privacy Policy, and a Greasy Fork–compliant UserScript header.

---

## Part 1: Publishing to Microsoft Edge Add-ons

> [!TIP]
> **Free Developer Registration**: Unlike the Chrome Web Store (\$5 fee), **Microsoft Edge Partner Center registration is 100% free (\$0)** for individual developers.

### Step 1: Register on Microsoft Partner Center

1. Sign in with a **personal Microsoft account** (`@outlook.com`, `@hotmail.com`, or `@live.com`—do not use a work/school Azure AD account).
2. Open the Microsoft Edge program registration page:
   <https://partner.microsoft.com/dashboard/microsoftedge/public/login>
3. Select **Individual** account type, enter your publisher display name (e.g., `Quiyyy`), and complete email verification.

### Step 2: Build the Clean Store ZIP Archive

Microsoft Edge Add-ons requires `manifest.json` at the root of the ZIP archive without development files (`.git`, `docs`, `scripts`, etc.). Run:

```bash
npm run pack
```

This generates:
- **Extension Store Package**: `dist/refined-gemini-v1.5.1-extension.zip`
- **300×300 Store Logo**: `docs/assets/store-logo-300.png`

### Step 3: Upload Package & Configure Properties

1. In Partner Center, navigate to **Microsoft Edge -> Overview -> Create new extension**.
2. Under **Packages**, upload `dist/refined-gemini-v1.5.1-extension.zip`. Partner Center automatically detects `English` (default) and `Chinese (Simplified)` from `_locales/`.
3. Under **Availability**, select **Public** and enable all markets.
4. Under **Properties**:
   - **Category**: `Productivity`
   - **Privacy Policy URL**:
     ```text
     https://github.com/Quiyyy/refined-gemini/blob/main/docs/PRIVACY.md
     ```
   - **Website / Support URL**:
     ```text
     https://github.com/Quiyyy/refined-gemini/issues
     ```
   - **Does your extension collect personal data?**: **No**

### Step 4: Fill Out Store Listings (`English` & `Chinese (Simplified)`)

- **Store Logo (`300×300` PNG)**: Upload `docs/assets/store-logo-300.png`.
- **Screenshots (`1280×800` or `640×400` PNG, at least 1)**: Upload light/dark chat screenshots and Popup preview.
- **Search Terms (up to 7)**: `gemini`, `chatgpt`, `google gemini`, `gemini ui`, `gemini theme`, `markdown`, `ai chat`
- **Detailed Description (English)**:
  ```text
  Refined Gemini aligns the Google Gemini Web UI 1:1 with ChatGPT's clean typography, color surfaces, and layout standards:

  • Clean Surfaces & Accents: Crisp white (#FFFFFF) and charcoal (#212121) canvases paired with soft-blue user bubbles (#E5F3FF) and ChatGPT #0285FF accent controls.
  • Uniform Typography & Configurable Indentation: Consistent 16px prose/heading scale (distinguished by semibold weight & spacing) and OpenAI Markdown list hierarchy with 0% / 65% / GPT / 125% presets.
  • Interactive Diagrams & Follow-Up Cards: Harmonizes embedded Generative UI diagrams (<genui-sandbox> about:srcdoc & SafeContentFrame) and redraws follow-up prompts into lightweight thin-bordered cards.
  • Compact Code Cards & Borderless Tables: Unified rounded code blocks with OpenAI syntax highlighting and clean horizontal-rule tables without fake scrollbars.
  • Streamlined Bilingual Popup (EN / 中文): Instant live controls for column width (768px–90%), font size (15–17px), hiding AI avatars, compact sidebar, clean view, and Ctrl/Cmd + Enter to send.
  • Privacy First: Runs 100% locally in your browser with zero data collection and zero network requests. Open-source under MIT.
  ```

### Step 5: Notes for Certification & Submit

Paste the following into **Publish -> Notes for certification** (typical review takes **1–3 business days**):

```text
Single Purpose: Customizes the visual appearance, typography, and keyboard shortcut (Ctrl+Enter) of Google Gemini Web (https://gemini.google.com/*) locally in the user's browser.
Permissions Justification:
- "storage": Used solely to persist local UI preferences (theme, column width, font size, indentation scale, and UI language) via chrome.storage.sync.
- Host "https://gemini.google.com/*": Injects core CSS/JS on Google Gemini web pages (plus match_origin_as_fallback for Gemini's embedded <genui-sandbox> about:srcdoc diagram iframes) to apply ChatGPT-aligned styling and optional Ctrl+Enter send behavior.
- Subframe hosts "https://*.scf.usercontent.goog/*" and "https://*.googleusercontent.com/*" (all_frames, subframe-only guard `window !== window.top`): Google Gemini renders interactive Generative UI diagrams/flowcharts inside isolated SafeContentFrame iframes hosted on `*.scf.usercontent.goog` / `*.googleusercontent.com` as well as opaque `about:srcdoc` iframes. Injecting `sandbox.css` + `sandbox.js` into these embedded subframes keeps interactive diagrams synchronized with the user's selected Light/Dark theme and font size. Top-level tabs and auth/feedback frames are explicitly ignored.
No user data is collected or transmitted externally. No login credentials are required to test—open https://gemini.google.com/app and click the extension toolbar icon to test all real-time toggles.
```

---

## Part 2: Publishing to UserScript Marketplaces (Greasy Fork & ScriptCat)

`userscript/refined-gemini.user.js` (generated via `npm run build:userscript`) follows all Greasy Fork & ScriptCat hosting requirements:
- Includes localized `@name` / `@name:zh-CN` and `@description` / `@description:zh-CN` headers;
- Declares SPDX `@license MIT` and unminified human-readable source code;
- **Omits external `@updateURL` / `@downloadURL`** (required by Greasy Fork's hosting policy).

### Option A: Greasy Fork (Global UserScript Registry with GitHub Webhook Sync)

1. Sign in to <https://greasyfork.org> using your **GitHub** account.
2. Open your profile page and click **Post a script**.
3. Switch to **Import from URL** and enter the raw GitHub URL:
   ```text
   https://raw.githubusercontent.com/Quiyyy/refined-gemini/main/userscript/refined-gemini.user.js
   ```
4. Set sync type to **Automatic**, paste the overview from `README.md` into **Additional info**, and click **Post script** (publishes immediately).
5. **(Optional) Automatic GitHub Webhook Updates**:
   - On your Greasy Fork profile, click **Set up GitHub webhook** and copy the Payload URL & Secret.
   - In your GitHub repo (`Settings -> Webhooks -> Add webhook`), set Content type to `application/json`, paste the Payload URL & Secret, and select `Just the push event`. Every `npm run build && git push` will automatically sync new releases to Greasy Fork.

### Option B: ScriptCat (`scriptcat.org`)

1. Sign in to <https://scriptcat.org> via GitHub and click **Publish Script (发布脚本)**.
2. Paste `userscript/refined-gemini.user.js` or bind the raw GitHub URL above for automatic sync, then submit.
