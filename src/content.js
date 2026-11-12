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
    themeMode: 'auto',
    chatWidth: '768px',
    fontSize: '16px',
    hideAvatar: true,
    compactSidebar: true,
    cleanView: true,
    ctrlEnterSend: false
  };

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
          currentSettings = { ...DEFAULTS, ...parsed };
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
   * Apply all settings as root attributes and CSS custom properties on <html>.
   */
  function applySettings(nextSettings) {
    currentSettings = { ...DEFAULTS, ...nextSettings };
    const root = document.documentElement;
    if (!root) return;

    if (!currentSettings.enabled) {
      root.setAttribute('data-rg-enabled', 'false');
      root.style.removeProperty('--rg-chat-max-width');
      root.style.removeProperty('--rg-font-size');
      return;
    }

    const effectiveTheme = resolveEffectiveTheme(currentSettings.themeMode);

    root.setAttribute('data-rg-enabled', 'true');
    root.setAttribute('data-rg-theme', effectiveTheme);
    root.setAttribute('data-rg-hide-avatar', String(Boolean(currentSettings.hideAvatar)));
    root.setAttribute('data-rg-compact-sidebar', String(Boolean(currentSettings.compactSidebar)));
    root.setAttribute('data-rg-clean-view', String(Boolean(currentSettings.cleanView)));
    root.setAttribute('data-rg-ctrl-enter', String(Boolean(currentSettings.ctrlEnterSend)));

    root.style.setProperty('--rg-chat-max-width', currentSettings.chatWidth || DEFAULTS.chatWidth);
    root.style.setProperty('--rg-font-size', currentSettings.fontSize || DEFAULTS.fontSize);
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
      'input-area-v2 button.send-button:not([disabled]):not([aria-disabled="true"])',
      '.input-area button.send-button:not([disabled]):not([aria-disabled="true"])',
      'button[aria-label*="Send message"]:not([disabled])',
      'button[aria-label*="发送"]:not([disabled])',
      'button.submit:not([disabled])'
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

  // 1. Apply cached configuration synchronously at document_start
  loadCachedSettings();
  applySettings(currentSettings);

  // 2. Attach observers & keyboard handler
  setupThemeObservers();
  setupCtrlEnterHandler();

  // 3. Hydrate from chrome.storage.sync
  initExtensionStorageSync();
})();
