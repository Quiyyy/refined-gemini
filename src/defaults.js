/**
 * Refined Gemini — Default Configuration & Settings Schema (Single Source of Truth)
 * Aligns Google Gemini Web UI 1:1 with ChatGPT Web typography & surface standards.
 *
 * Every runtime (content script, sandbox script, popup, background worker and the
 * generated UserScript) reads defaults, allowed values and normalization from here,
 * so option sets can never drift between surfaces again.
 */
(function (root) {
  const DEFAULTS = Object.freeze({
    enabled: true,          // Master toggle: instant on/off comparison with native Gemini
    uiLang: 'auto',         // 'auto' (follow browser language) | 'zh' | 'en'
    themeMode: 'auto',      // 'auto' (follow Gemini/system) | 'light' | 'dark'
    chatWidth: '800px',     // '800px' (768px prose + 32px padding = 1:1 ChatGPT 48rem) | '920px' | '1120px' | '90%'
    fontSize: '16px',       // '15px' | '16px' (default) | '17px'
    indentScale: '1',       // '0' (flush-left) | '0.65' (compact) | '1' (1:1 ChatGPT default) | '1.25' (relaxed)
    hideAvatar: true,       // Hide Gemini star avatar for flush-left baseline alignment (a pulsing dot marks pending replies)
    compactSidebar: true,   // Converge sidebar to 260px width & 8px rounded items
    cleanView: true,        // Hide bottom disclaimer, IP footer & upsell/discovery banners (follow-up cards stay visible)
    scaledHeadings: false,  // false = uniform 16px headings (weight-only hierarchy) | true = gentle h1–h3 size scale
    ctrlEnterSend: false    // When enabled, plain Enter inserts newline; Ctrl/Cmd+Enter sends
  });

  /** Allowed values for every enumerated setting (first entry is never implied as default). */
  const OPTIONS = Object.freeze({
    uiLang: Object.freeze(['auto', 'zh', 'en']),
    themeMode: Object.freeze(['auto', 'light', 'dark']),
    chatWidth: Object.freeze(['800px', '920px', '1120px', '90%']),
    fontSize: Object.freeze(['15px', '16px', '17px']),
    indentScale: Object.freeze(['0', '0.65', '1', '1.25'])
  });

  const BOOLEAN_KEYS = Object.freeze([
    'enabled',
    'hideAvatar',
    'compactSidebar',
    'cleanView',
    'scaledHeadings',
    'ctrlEnterSend'
  ]);

  /** Legacy value migrations (kept forever so old synced settings keep working). */
  const LEGACY_VALUES = Object.freeze({
    chatWidth: Object.freeze({ '768px': '800px' })
  });

  /**
   * Merge raw (possibly stale / partial / corrupted) settings over DEFAULTS and coerce
   * every key into its allowed domain.
   */
  function normalize(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS)) {
      if (!Object.prototype.hasOwnProperty.call(src, key) || src[key] === undefined) continue;
      let val = src[key];
      if (BOOLEAN_KEYS.includes(key)) {
        out[key] = Boolean(val);
        continue;
      }
      val = String(val);
      const legacy = LEGACY_VALUES[key];
      if (legacy && Object.prototype.hasOwnProperty.call(legacy, val)) val = legacy[val];
      if (OPTIONS[key] && OPTIONS[key].includes(val)) out[key] = val;
    }
    return out;
  }

  /** Resolve 'auto' UI language against the browser locale. */
  function resolveLang(uiLang, navigatorLang) {
    if (uiLang === 'zh' || uiLang === 'en') return uiLang;
    const nav = String(navigatorLang || (root.navigator && root.navigator.language) || '').toLowerCase();
    return nav.startsWith('zh') ? 'zh' : 'en';
  }

  const API = Object.freeze({
    DEFAULTS,
    OPTIONS,
    BOOLEAN_KEYS,
    STORAGE_KEY: 'refined_gemini_settings_v1',
    TOGGLE_SHORTCUT: 'Alt+Shift+G',
    ISSUES_URL: 'https://github.com/Quiyyy/refined-gemini/issues/new',
    normalize,
    resolveLang
  });

  root.REFINED_GEMINI = API;
  // Backward-compatible globals
  root.REFINED_GEMINI_DEFAULTS = DEFAULTS;
  root.REFINED_GEMINI_STORAGE_KEY = API.STORAGE_KEY;
})(typeof globalThis !== 'undefined' ? globalThis : self);
