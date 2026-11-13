/**
 * Refined Gemini — Content Script
 *
 * Responsibilities:
 *   1. Zero-FOUC startup via synchronous localStorage cache at document_start.
 *   2. Real-time sync with chrome.storage.sync and Popup messages (instant live preview).
 *   3. Accurate Light/Dark theme resolution (auto-detecting Gemini's active theme or forcing light/dark).
 *   4. Optional IME-safe Ctrl / Cmd + Enter to send (plain Enter inserts a line break).
 */
(function () {
  'use strict';

  const STORAGE_KEY = globalThis.REFINED_GEMINI_STORAGE_KEY || 'refined_gemini_settings_v1';
  const DEFAULTS = globalThis.REFINED_GEMINI_DEFAULTS || {
    enabled: true,
    uiLang: 'auto',
    themeMode: 'auto',
    chatWidth: '800px',
    fontSize: '16px',
    indentScale: '1',
    hideAvatar: true,
    compactSidebar: true,
    cleanView: true,
    ctrlEnterSend: false
  };

  const VALID_INDENT_SCALES = new Set(['0', '0.65', '1', '1.25']);
  const VALID_LANGS = new Set(['auto', 'zh', 'en']);

  function normalizeSettings(rawSettings) {
    const merged = { ...DEFAULTS, ...rawSettings };
    if (merged.chatWidth === '768px') {
      merged.chatWidth = '800px';
    }
    if (!VALID_INDENT_SCALES.has(String(merged.indentScale))) {
      merged.indentScale = '1';
    } else {
      merged.indentScale = String(merged.indentScale);
    }
    if (!VALID_LANGS.has(String(merged.uiLang))) {
      merged.uiLang = 'auto';
    }
    return merged;
  }

  let currentSettings = { ...DEFAULTS };

  /**
   * Read synchronous cache so document_start applies tokens before first paint.
   */
  function loadCachedSettings() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          currentSettings = normalizeSettings(parsed);
        }
      }
    } catch (_) {
      // Ignore storage access restrictions in sandboxed frames
    }
  }

  function writeCachedSettings(settings) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {
      // Ignore quota or privacy errors
    }
  }

  /**
   * Detect whether native Gemini is currently rendering in dark mode.
   */
  function detectNativeDarkTheme() {
    const docEl = document.documentElement;
    const body = document.body;

    if (body) {
      if (body.classList.contains('dark-theme') || body.getAttribute('data-theme') === 'dark') {
        return true;
      }
      if (body.classList.contains('light-theme') || body.getAttribute('data-theme') === 'light') {
        return false;
      }
    }

    if (docEl) {
      if (docEl.classList.contains('dark') || docEl.classList.contains('dark-theme')) {
        return true;
      }
      if (docEl.classList.contains('light') || docEl.classList.contains('light-theme')) {
        return false;
      }
      const colorScheme = docEl.style.colorScheme || docEl.getAttribute('color-scheme');
      if (colorScheme === 'dark') return true;
      if (colorScheme === 'light') return false;
    }

    // Fallback to OS media query before body classes hydrate
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function resolveEffectiveTheme(themeMode) {
    if (themeMode === 'light') return 'light';
    if (themeMode === 'dark') return 'dark';
    return detectNativeDarkTheme() ? 'dark' : 'light';
  }

  /**
   * Ensure non-scrolling outer `.chat-container` never retains a stale programmatic `scrollTop`
   * across SPA conversation switches.
   */
  function resetOuterChatScroll() {
    if (!document.body) return;
    const containers = document.querySelectorAll('.chat-container');
    for (const el of containers) {
      if (el.scrollTop !== 0 && el.querySelector('infinite-scroller.chat-history')) {
        el.scrollTop = 0;
      }
    }
  }

  // Curated Google M3 / Luminous (Cgk) diagram hex -> ChatGPT Light & Dark hex maps
  // Strictly used on inline diagram/chart SVGs inside svg-code-block / vega-lite-chart / google-chart / gen-ui-html
  const INLINE_SVG_LIGHT_HEX = {
    '#3186ff': '#0285ff', '#1a73e8': '#0285ff', '#4285f4': '#0285ff', '#3b82f6': '#0285ff',
    '#0b57d0': '#0169cc', '#0e57d0': '#0169cc', '#1967d2': '#0169cc', '#174ea6': '#0169cc', '#2563eb': '#0169cc',
    '#041e49': '#0d0d0d', '#001d35': '#0d0d0d',
    '#dcf1ff': '#e5f3ff', '#d3e3fd': '#e5f3ff', '#e8f0fe': '#e5f3ff', '#d2e3fc': '#e5f3ff', '#dbeafe': '#e5f3ff', '#eff6ff': '#e5f3ff',
    '#9dd2ff': '#99ceff', '#a8c7fa': '#99ceff',
    '#fdfcfc': '#ffffff', '#f2f0f0': '#f7f7f8', '#f4f3f2': '#f7f7f8', '#f4f3f0': '#f7f7f8', '#f7f6f6': '#f7f7f8',
    '#faf9f9': '#f9f9f9', '#f0f4f9': '#f7f7f8', '#e8eef6': '#f4f4f4', '#dde3e9': '#ececec', '#f1f3f4': '#f4f4f4', '#f8f9fa': '#f7f7f8',
    '#1f1f1f': '#0d0d0d', '#3c4043': '#0d0d0d', '#444746': '#5d5d5d', '#5f6368': '#5d5d5d', '#747775': '#8f8f8f'
  };

  const INLINE_SVG_DARK_HEX = {
    '#3186ff': '#0285ff', '#1a73e8': '#0285ff', '#4285f4': '#0285ff', '#3b82f6': '#0285ff',
    '#0b57d0': '#66b5ff', '#0e57d0': '#66b5ff', '#1967d2': '#66b5ff', '#174ea6': '#66b5ff', '#2563eb': '#66b5ff',
    '#a8c7fa': '#66b5ff', '#a7c7fa': '#66b5ff', '#8ab4f8': '#66b5ff', '#93c5fd': '#66b5ff',
    '#dcf1ff': '#1a3550', '#d3e3fd': '#1a3550', '#e8f0fe': '#1a3550', '#d2e3fc': '#1a3550', '#dbeafe': '#1a3550', '#eff6ff': '#1a3550',
    '#0842a0': '#1a3550', '#0842a1': '#1a3550', '#192967': '#1a3550', '#1e3a8a': '#1a3550',
    '#fdfcfc': '#212121', '#0f0f0f': '#212121', '#1b1b1b': '#212121',
    '#f2f0f0': '#2a2a2a', '#f4f3f2': '#2a2a2a', '#f4f3f0': '#2a2a2a', '#f7f6f6': '#2a2a2a',
    '#faf9f9': '#262626', '#fafafa': '#262626', '#f0f4f9': '#2a2a2a', '#f8f9fa': '#262626',
    '#f1f3f4': '#2f2f2f', '#e8eef6': '#2f2f2f', '#dde3e9': '#383838', '#dadce0': '#3c3c3c', '#e0e0e0': '#3c3c3c', '#cccccc': '#3c3c3c',
    '#282a2c': '#2a2a2a', '#202021': '#171717', '#2a2b2c': '#2f2f2f',
    '#041e49': '#ececec', '#001d35': '#ececec', '#1f1f1f': '#ececec', '#202124': '#ececec',
    '#111827': '#ececec', '#1f2937': '#ececec', '#374151': '#ececec', '#3c4043': '#ececec',
    '#e3e3e3': '#ececec', '#e6e6e6': '#ececec', '#444746': '#b4b4b4', '#4b5563': '#b4b4b4',
    '#5f6368': '#b4b4b4', '#6b7280': '#b4b4b4', '#c4c7c5': '#b4b4b4', '#747775': '#8e8ea0'
  };

  const INLINE_DIAGRAM_ROOT_SEL =
    ':is(svg-code-block, .svg-preview, vega-lite-chart, google-chart, deep-zoom, gen-ui-html):not(web-preview *)';

  let isInlineSvgMutating = false;

  function harmonizeInlineDiagrams() {
    if (!document.body) return;
    const enabled = Boolean(currentSettings.enabled);
    const theme = resolveEffectiveTheme(currentSettings.themeMode);
    const map = theme === 'dark' ? INLINE_SVG_DARK_HEX : INLINE_SVG_LIGHT_HEX;

    isInlineSvgMutating = true;
    try {
      const svgs = document.body.querySelectorAll(`${INLINE_DIAGRAM_ROOT_SEL} svg`);
      for (const svg of svgs) {
        if (svg.closest('web-preview')) continue;

        for (const styleEl of svg.querySelectorAll('style')) {
          const cur = styleEl.textContent || '';
          if (styleEl.__rgOrigCss === undefined || (!enabled && styleEl.__rgLastOut !== cur)) {
            styleEl.__rgOrigCss = cur;
          } else if (enabled && styleEl.__rgLastOut !== undefined && styleEl.__rgLastOut !== cur) {
            styleEl.__rgOrigCss = cur;
          }
          if (!enabled) {
            if (styleEl.__rgOrigCss !== undefined && cur !== styleEl.__rgOrigCss) {
              styleEl.textContent = styleEl.__rgOrigCss;
            }
            styleEl.__rgLastOut = undefined;
          } else {
            const nextCss = styleEl.__rgOrigCss.replace(/#[0-9a-fA-F]{6}\b/g, (hex) => {
              const lower = hex.toLowerCase();
              return map[lower] || hex;
            });
            if (cur !== nextCss) styleEl.textContent = nextCss;
            styleEl.__rgLastOut = nextCss;
          }
        }

        const nodes = svg.querySelectorAll('[fill], [stroke]');
        for (const el of nodes) {
          const tag = (el.tagName || '').toLowerCase();
          const isText = tag === 'text' || tag === 'tspan';
          for (const attr of ['fill', 'stroke']) {
            if (!el.hasAttribute(attr)) continue;
            const backupAttr = `data-rg-orig-${attr}`;
            const lastProp = attr === 'fill' ? '__rgLastFill' : '__rgLastStroke';
            const val = (el.getAttribute(attr) || '').trim();
            if (!enabled) {
              if (el.hasAttribute(backupAttr)) {
                el.setAttribute(attr, el.getAttribute(backupAttr) || val);
                el.removeAttribute(backupAttr);
              }
              el[lastProp] = undefined;
              continue;
            }
            if (el[lastProp] !== undefined && val !== el[lastProp]) {
              el.setAttribute(backupAttr, val);
            }
            const orig = el.hasAttribute(backupAttr) ? el.getAttribute(backupAttr) || val : val;
            let mapped = map[orig.toLowerCase()];
            if (!mapped && theme === 'dark') {
              if (attr === 'fill' && /^#(?:ffffff|fff)$/i.test(orig) && !isText) {
                mapped = '#262626';
              } else if ((isText || attr === 'stroke') && /^#(?:000000|000)$/i.test(orig)) {
                mapped = '#ececec';
              }
            }
            if (mapped && val.toLowerCase() !== mapped) {
              if (!el.hasAttribute(backupAttr)) {
                el.setAttribute(backupAttr, orig);
              }
              el.setAttribute(attr, mapped);
              el[lastProp] = mapped;
            } else {
              el[lastProp] = val;
            }
          }
        }
      }
    } finally {
      queueMicrotask(() => {
        isInlineSvgMutating = false;
      });
    }
  }

  /**
   * Detect whether an iframe belongs to user-authored Canvas / <web-preview>
   * (Layer 3 whitelist: never alter user-created web app colors or typography).
   */
  function isUserPreviewFrame(frame) {
    let cur = frame;
    while (cur && cur.nodeType === 1) {
      if (
        typeof cur.matches === 'function' &&
        cur.matches(
          'web-preview, [data-testid*="web-preview"], immersive-panel:not(:has(deep-research-immersive-panel))'
        )
      ) {
        return true;
      }
      const root = typeof cur.getRootNode === 'function' ? cur.getRootNode() : null;
      cur = cur.parentElement || (root && root.host ? root.host : null);
    }
    return false;
  }

  /**
   * Broadcast active theme, enable state, and font-size to embedded Generative UI
   * sandbox iframes (`about:srcdoc`, `*.scf.usercontent.goog`, `*.googleusercontent.com`),
   * while passing `enabled: false, isUserPreview: true` to `<web-preview>` frames.
   */
  function getSandboxSyncPayload(isUserPreview = false) {
    const enabled = Boolean(currentSettings.enabled) && !isUserPreview;
    const theme = resolveEffectiveTheme(currentSettings.themeMode);
    return {
      type: 'RG_SANDBOX_SYNC',
      enabled,
      isUserPreview: Boolean(isUserPreview),
      theme,
      themeMode: currentSettings.themeMode || 'auto',
      fontSize: currentSettings.fontSize || DEFAULTS.fontSize
    };
  }

  const boundFrames = new WeakSet();
  const SHADOW_FRAME_HOSTS =
    'safe-content-frame, sandbox-frame, generative-ui-frame, mcp-tool-ui-frame, deep-zoom, mini-app, web-preview';

  function collectSandboxFrames() {
    const frames = new Set(document.querySelectorAll('iframe'));
    const shadowHosts = document.querySelectorAll(SHADOW_FRAME_HOSTS);
    for (const hostEl of shadowHosts) {
      if (hostEl.shadowRoot) {
        for (const innerFrame of hostEl.shadowRoot.querySelectorAll('iframe')) {
          frames.add(innerFrame);
        }
      }
    }
    for (const frame of frames) {
      if (!boundFrames.has(frame)) {
        boundFrames.add(frame);
        frame.addEventListener('load', () => {
          try {
            if (frame.contentWindow) {
              frame.contentWindow.postMessage(getSandboxSyncPayload(isUserPreviewFrame(frame)), '*');
            }
          } catch (_) {}
        });
      }
    }
    return frames;
  }

  function broadcastToSandboxFrames() {
    if (!document.documentElement) return;
    for (const frame of collectSandboxFrames()) {
      try {
        if (frame.contentWindow) {
          frame.contentWindow.postMessage(getSandboxSyncPayload(isUserPreviewFrame(frame)), '*');
        }
      } catch (_) {}
    }
  }

  /**
   * Apply all settings as root attributes and CSS custom properties on <html>.
   */
  function applySettings(nextSettings) {
    currentSettings = normalizeSettings(nextSettings);
    const root = document.documentElement;
    if (!root) return;

    if (!currentSettings.enabled) {
      root.setAttribute('data-rg-enabled', 'false');
      root.removeAttribute('data-rg-indent');
      root.style.removeProperty('--rg-chat-max-width');
      root.style.removeProperty('--rg-font-size');
      root.style.removeProperty('--rg-indent-scale');
      harmonizeInlineDiagrams();
      broadcastToSandboxFrames();
      return;
    }

    const effectiveTheme = resolveEffectiveTheme(currentSettings.themeMode);
    const indentScale = currentSettings.indentScale || DEFAULTS.indentScale;

    root.setAttribute('data-rg-enabled', 'true');
    root.setAttribute('data-rg-theme', effectiveTheme);
    root.setAttribute('data-rg-indent', indentScale === '0' ? 'none' : 'scaled');
    root.setAttribute('data-rg-hide-avatar', String(Boolean(currentSettings.hideAvatar)));
    root.setAttribute('data-rg-compact-sidebar', String(Boolean(currentSettings.compactSidebar)));
    root.setAttribute('data-rg-clean-view', String(Boolean(currentSettings.cleanView)));
    root.setAttribute('data-rg-ctrl-enter', String(Boolean(currentSettings.ctrlEnterSend)));

    root.style.setProperty('--rg-chat-max-width', currentSettings.chatWidth || DEFAULTS.chatWidth);
    root.style.setProperty('--rg-font-size', currentSettings.fontSize || DEFAULTS.fontSize);
    root.style.setProperty('--rg-indent-scale', indentScale);
    resetOuterChatScroll();
    harmonizeInlineDiagrams();
    broadcastToSandboxFrames();
  }

  /**
   * Watch class/attribute mutations on <html> and <body> so 'auto' themeMode
   * updates seamlessly whenever the user switches Gemini's native theme.
   */
  function setupThemeObservers() {
    let scheduled = false;
    const refreshThemeIfAuto = () => {
      if (!currentSettings.enabled || currentSettings.themeMode !== 'auto') return;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        const root = document.documentElement;
        if (!root || !currentSettings.enabled) return;
        const nextTheme = resolveEffectiveTheme('auto');
        if (root.getAttribute('data-rg-theme') !== nextTheme) {
          root.setAttribute('data-rg-theme', nextTheme);
          harmonizeInlineDiagrams();
          broadcastToSandboxFrames();
        }
      });
    };

    const attrObserver = new MutationObserver(refreshThemeIfAuto);
    attrObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'color-scheme', 'style']
    });

    const attachBodyObserver = () => {
      if (!document.body) return;
      refreshThemeIfAuto();
      attrObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'style']
      });
    };

    if (document.body) {
      attachBodyObserver();
    } else {
      document.addEventListener('DOMContentLoaded', attachBodyObserver, { once: true });
    }

    if (window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', refreshThemeIfAuto);
      }
    }
  }

  /**
   * Ctrl / Cmd + Enter to Send handler (IME composition safe).
   * When enabled:
   *   - Plain Enter inside Gemini's prompt editor inserts a line break instead of submitting.
   *   - Ctrl + Enter (Windows/Linux) or Cmd + Enter (macOS) triggers send.
   */
  function isPromptEditorElement(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest(
        'rich-textarea, .ql-editor, input-area-v2 [contenteditable="true"], .input-area [contenteditable="true"], .query-input textarea'
      )
    );
  }

  function findSendButton() {
    const selectors = [
      'input-area-v2 gem-icon-button.send-button:not(.gem-button-disabled):not([aria-disabled="true"]) button:not([disabled]):not([aria-disabled="true"])',
      'input-area-v2 button.send-button:not([disabled]):not([aria-disabled="true"])',
      '.input-area gem-icon-button.send-button:not(.gem-button-disabled):not([aria-disabled="true"]) button:not([disabled]):not([aria-disabled="true"])',
      '.input-area button.send-button:not([disabled]):not([aria-disabled="true"])',
      '.send-button-container button:not([disabled]):not([aria-disabled="true"])',
      'button[aria-label*="Send message"]:not([disabled]):not([aria-disabled="true"])',
      'button[aria-label*="发送"]:not([disabled]):not([aria-disabled="true"])',
      'button.submit:not([disabled]):not([aria-disabled="true"])'
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn instanceof HTMLElement) return btn;
    }
    return null;
  }

  const bypassedEvents = new WeakSet();

  function setupCtrlEnterHandler() {
    window.addEventListener(
      'keydown',
      (event) => {
        if (!currentSettings.enabled || !currentSettings.ctrlEnterSend) return;
        if (bypassedEvents.has(event)) return;
        if (event.key !== 'Enter') return;
        // Never interfere with CJK / IME candidate selection
        if (event.isComposing || event.keyCode === 229) return;
        if (!isPromptEditorElement(event.target)) return;

        const hasSendModifier = event.ctrlKey || event.metaKey;

        if (hasSendModifier && !event.altKey) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const sendBtn = findSendButton();
          if (sendBtn) {
            sendBtn.click();
          } else if (event.target instanceof HTMLElement) {
            // Fallback: dispatch an unguarded Enter event for Gemini's native handler
            const submitEvt = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            bypassedEvents.add(submitEvt);
            event.target.dispatchEvent(submitEvt);
          }
          return;
        }

        // Plain Enter (no Shift/Ctrl/Meta/Alt) -> insert newline without sending
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          event.stopImmediatePropagation();

          const target = event.target;
          if (target instanceof HTMLTextAreaElement) {
            const start = target.selectionStart ?? target.value.length;
            const end = target.selectionEnd ?? target.value.length;
            target.setRangeText('\n', start, end, 'end');
            target.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            // Quill / contenteditable editor inside Gemini's <rich-textarea>
            document.execCommand('insertParagraph', false);
          }
        }
      },
      true
    );
  }

  /**
   * Synchronize with chrome.storage.sync & Popup live messages.
   */
  function initExtensionStorageSync() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
      return;
    }

    chrome.storage.sync.get(DEFAULTS, (stored) => {
      if (chrome.runtime && chrome.runtime.lastError) return;
      const merged = { ...DEFAULTS, ...stored };
      writeCachedSettings(merged);
      applySettings(merged);
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;
      const updated = { ...currentSettings };
      let changed = false;
      for (const key of Object.keys(DEFAULTS)) {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
          updated[key] = changes[key].newValue;
          changed = true;
        }
      }
      if (changed) {
        writeCachedSettings(updated);
        applySettings(updated);
      }
    });

    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg && msg.type === 'RG_APPLY_SETTINGS' && msg.payload) {
          const merged = { ...DEFAULTS, ...currentSettings, ...msg.payload };
          writeCachedSettings(merged);
          applySettings(merged);
          sendResponse({ ok: true });
        }
        return false;
      });
    }
  }

  function setupScrollGuard() {
    window.addEventListener('popstate', () => requestAnimationFrame(resetOuterChatScroll), { passive: true });
    window.addEventListener(
      'click',
      (e) => {
        if (!currentSettings.enabled || !(e.target instanceof Element)) return;
        if (
          e.target.closest(
            'bard-sidenav, mat-sidenav, side-navigation-content, conversations-list, [data-test-id="conversation"], [data-test-id="new-chat-button"]'
          )
        ) {
          requestAnimationFrame(resetOuterChatScroll);
          setTimeout(resetOuterChatScroll, 180);
        }
      },
      { passive: true }
    );
  }

  function setupSandboxHandshake() {
    window.addEventListener('message', (event) => {
      const data = event && event.data;
      if (!data || typeof data !== 'object' || data.type !== 'RG_SANDBOX_READY') return;
      let matched = false;
      for (const frame of collectSandboxFrames()) {
        try {
          if (frame.contentWindow === event.source) {
            matched = true;
            frame.contentWindow.postMessage(getSandboxSyncPayload(isUserPreviewFrame(frame)), '*');
            break;
          }
        } catch (_) {}
      }
      if (!matched) {
        try {
          if (event.source && typeof event.source.postMessage === 'function') {
            event.source.postMessage(getSandboxSyncPayload(false), '*');
          }
        } catch (_) {}
      }
      broadcastToSandboxFrames();
    });

    let frameScanPending = false;
    const scheduleFrameSync = () => {
      if (isInlineSvgMutating || frameScanPending) return;
      frameScanPending = true;
      requestAnimationFrame(() => {
        frameScanPending = false;
        harmonizeInlineDiagrams();
        broadcastToSandboxFrames();
      });
    };

    const DYNAMIC_WIDGET_SEL =
      'iframe, genui-sandbox, gen-ui-html, sandbox-frame, safe-content-frame, generative-ui-frame, mcp-tool-ui-frame, deep-zoom, mini-app, web-preview, svg-code-block, vega-lite-chart, google-chart';

    const attachFrameObserver = () => {
      if (!document.body) return;
      harmonizeInlineDiagrams();
      broadcastToSandboxFrames();
      const frameObserver = new MutationObserver((mutations) => {
        if (isInlineSvgMutating) return;
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = /** @type {Element} */ (node);
            const tag = el.tagName;
            if (
              tag === 'IFRAME' ||
              tag === 'SVG' ||
              tag === 'GEN-UI-HTML' ||
              tag === 'GENUI-SANDBOX' ||
              tag === 'SANDBOX-FRAME' ||
              tag === 'SAFE-CONTENT-FRAME' ||
              tag === 'SVG-CODE-BLOCK' ||
              tag === 'VEGA-LITE-CHART' ||
              tag === 'GOOGLE-CHART' ||
              tag === 'GENERATIVE-UI-FRAME' ||
              tag === 'MCP-TOOL-UI-FRAME' ||
              tag === 'DEEP-ZOOM' ||
              tag === 'MINI-APP' ||
              tag === 'WEB-PREVIEW' ||
              (el.querySelector && el.querySelector(DYNAMIC_WIDGET_SEL))
            ) {
              scheduleFrameSync();
              return;
            }
          }
        }
      });
      frameObserver.observe(document.body, { childList: true, subtree: true });
    };

    if (document.body) {
      attachFrameObserver();
    } else {
      document.addEventListener('DOMContentLoaded', attachFrameObserver, { once: true });
    }
  }

  // 1. Apply cached configuration synchronously at document_start
  loadCachedSettings();
  applySettings(currentSettings);

  // 2. Attach observers, scroll guard, sandbox handshake & keyboard handler
  setupThemeObservers();
  setupScrollGuard();
  setupSandboxHandshake();
  setupCtrlEnterHandler();

  // 3. Hydrate from chrome.storage.sync
  initExtensionStorageSync();
})();
