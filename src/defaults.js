/**
 * Refined Gemini — Default Configuration (Single Source of Truth)
 * Aligns Google Gemini Web UI 1:1 with ChatGPT Web typography & surface standards.
 */
(function (root) {
  const DEFAULTS = Object.freeze({
    enabled: true,          // Master toggle: instant on/off comparison with native Gemini
    themeMode: 'auto',      // 'auto' (follow Gemini/system) | 'light' | 'dark'
    chatWidth: '800px',     // '800px' (768px prose + 32px padding = 1:1 ChatGPT 48rem) | '920px' | '1120px' | '90%'
    fontSize: '16px',       // '15px' (compact) | '16px' (default) | '17px' (comfortable)
    indentScale: '1',       // '0' (flush-left) | '0.65' (compact) | '1' (1:1 ChatGPT default) | '1.25' (relaxed)
    hideAvatar: true,       // Hide Gemini star avatar for flush-left baseline alignment
    compactSidebar: true,   // Converge sidebar to 260px width & 8px rounded items
    cleanView: true,        // Hide bottom disclaimer, IP footer, upsell badges & follow-up chips
    ctrlEnterSend: false    // When enabled, plain Enter inserts newline; Ctrl/Cmd+Enter sends
  });

  root.REFINED_GEMINI_DEFAULTS = DEFAULTS;
  root.REFINED_GEMINI_STORAGE_KEY = 'refined_gemini_settings_v1';
})(typeof globalThis !== 'undefined' ? globalThis : window);
