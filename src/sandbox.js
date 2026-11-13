/**
 * Refined Gemini — Generative UI Sandbox Content Script
 *
 * Runs strictly inside embedded Generative UI sandbox iframes
 * (*.scf.usercontent.goog / *.googleusercontent.com) to synchronize
 * ChatGPT Light/Dark theme tokens, uniform typography, and reversible
 * Google-to-ChatGPT palette harmonization on interactive diagrams & flowcharts.
 */
(function () {
  'use strict';

  // Never run in top-level tabs or unrelated Google feedback/auth frames
  if (window === window.top) return;

  const host = String(location.hostname || '').toLowerCase();
  if (
    host.startsWith('feedback') ||
    host.includes('accounts.google') ||
    host.includes('uservoice')
  ) {
    return;
  }

  const isScfHost = host.endsWith('.scf.usercontent.goog') || host === 'scf.usercontent.goog';

  const DEFAULTS = globalThis.REFINED_GEMINI_DEFAULTS || {
    enabled: true,
    themeMode: 'auto',
    fontSize: '16px'
  };

  let state = {
    enabled: Boolean(DEFAULTS.enabled),
    themeMode: DEFAULTS.themeMode || 'auto',
    parentTheme: null,
    fontSize: DEFAULTS.fontSize || '16px'
  };

  // Curated Google M3 / Lumi GenUI hex -> ChatGPT Light & Dark hex maps
  const LIGHT_HEX_MAP = {
    '#3186ff': '#0285ff',
    '#1a73e8': '#0285ff',
    '#4285f4': '#0285ff',
    '#0b57d0': '#0169cc',
    '#0e57d0': '#0169cc',
    '#1967d2': '#0169cc',
    '#174ea6': '#0169cc',
    '#041e49': '#0d0d0d',
    '#001d35': '#0d0d0d',
    '#dcf1ff': '#e5f3ff',
    '#d3e3fd': '#e5f3ff',
    '#e8f0fe': '#e5f3ff',
    '#d2e3fc': '#e5f3ff',
    '#9dd2ff': '#99ceff',
    '#a8c7fa': '#99ceff',
    '#f2f0f0': '#f7f7f8',
    '#f4f3f2': '#f7f7f8',
    '#faf9f9': '#f9f9f9',
    '#f0f4f9': '#f7f7f8',
    '#e8eef6': '#f4f4f4',
    '#dde3e9': '#ececec',
    '#f1f3f4': '#f4f4f4',
    '#f8f9fa': '#f7f7f8',
    '#1f1f1f': '#0d0d0d',
    '#444746': '#5d5d5d',
    '#5f6368': '#5d5d5d',
    '#747775': '#8f8f8f'
  };

  const DARK_HEX_MAP = {
    '#3186ff': '#0285ff',
    '#1a73e8': '#0285ff',
    '#4285f4': '#0285ff',
    '#0b57d0': '#66b5ff',
    '#0e57d0': '#66b5ff',
    '#1967d2': '#66b5ff',
    '#174ea6': '#66b5ff',
    '#a8c7fa': '#66b5ff',
    '#a7c7fa': '#66b5ff',
    '#8ab4f8': '#66b5ff',
    '#dcf1ff': '#1a3550',
    '#d3e3fd': '#1a3550',
    '#e8f0fe': '#1a3550',
    '#d2e3fc': '#1a3550',
    '#0842a0': '#1a3550',
    '#0842a1': '#1a3550',
    '#192967': '#1a3550',
    '#f2f0f0': '#2a2a2a',
    '#f4f3f2': '#2a2a2a',
    '#faf9f9': '#262626',
    '#f0f4f9': '#2a2a2a',
    '#f8f9fa': '#262626',
    '#f1f3f4': '#2f2f2f',
    '#e8eef6': '#2f2f2f',
    '#dde3e9': '#383838',
    '#dadce0': '#3c3c3c',
    '#282a2c': '#2a2a2a',
    '#202021': '#171717',
    '#2a2b2c': '#2f2f2f',
    '#1b1b1b': '#212121',
    '#041e49': '#ececec',
    '#001d35': '#ececec',
    '#1f1f1f': '#ececec',
    '#202124': '#ececec',
    '#e3e3e3': '#ececec',
    '#444746': '#b4b4b4',
    '#5f6368': '#b4b4b4',
    '#c4c7c5': '#b4b4b4',
    '#747775': '#8e8ea0'
  };

  function isGenUiDocument() {
    if (isScfHost) return true;
    return Boolean(
      document.getElementById('app-root') ||
        document.querySelector('.bot-response, script[data-sandbox-runtime]')
    );
  }

  function detectFrameTheme() {
    if (state.themeMode === 'light' || state.themeMode === 'dark') {
      return state.themeMode;
    }
    if (state.parentTheme === 'light' || state.parentTheme === 'dark') {
      return state.parentTheme;
    }
    const root = document.documentElement;
    if (root) {
      const cs = root.style.colorScheme || root.getAttribute('color-scheme') || '';
      if (cs.includes('dark')) return 'dark';
      if (cs.includes('light')) return 'light';
    }
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';
  }

  function transformWidgetCss(cssText, theme) {
    const map = theme === 'dark' ? DARK_HEX_MAP : LIGHT_HEX_MAP;
    let out = cssText.replace(/#[0-9a-fA-F]{6}\b/g, (hex) => {
      const lower = hex.toLowerCase();
      return map[lower] || hex;
    });
    if (theme === 'dark') {
      out = out.replace(
        /(background(?:-color)?\s*:\s*)#(?:ffffff|fff)\b/gi,
        '$1#212121'
      );
    }
    // Harmonize oversized GenUI heading/callout font-sizes (17px–24px / 1.1rem–1.4rem) to --rg-font-size
    out = out.replace(
      /font-size\s*:\s*(?:1[789]|2[0-4])(?:\.\d+)?px\b/gi,
      'font-size: var(--rg-font-size, 16px)'
    );
    out = out.replace(
      /font-size\s*:\s*1\.(?:0[5-9]|[1-4]\d*)(?:rem|em)\b/gi,
      'font-size: var(--rg-font-size, 16px)'
    );
    return out;
  }

  let isMutating = false;

  function harmonizeWidgetDom(enabled, theme) {
    if (!document.documentElement) return;
    isMutating = true;
    try {
      const styles = document.querySelectorAll('style:not([data-rg-own-style])');
      for (const styleEl of styles) {
        const current = styleEl.textContent || '';
        if (styleEl.__rgOrigCss === undefined || (!enabled && styleEl.__rgLastOut !== current)) {
          styleEl.__rgOrigCss = current;
        } else if (enabled && styleEl.__rgLastOut !== undefined && styleEl.__rgLastOut !== current) {
          // MorphDom updated the style tag during streaming
          styleEl.__rgOrigCss = current;
        }

        if (!enabled) {
          if (styleEl.__rgOrigCss !== undefined && current !== styleEl.__rgOrigCss) {
            styleEl.textContent = styleEl.__rgOrigCss;
          }
          styleEl.__rgLastOut = undefined;
        } else {
          const nextCss = transformWidgetCss(styleEl.__rgOrigCss, theme);
          if (current !== nextCss) {
            styleEl.textContent = nextCss;
          }
          styleEl.__rgLastOut = nextCss;
        }
      }

      const map = theme === 'dark' ? DARK_HEX_MAP : LIGHT_HEX_MAP;
      const svgNodes = document.querySelectorAll('svg [fill], svg [stroke]');
      for (const el of svgNodes) {
        for (const attr of ['fill', 'stroke']) {
          if (!el.hasAttribute(attr)) continue;
          const backupAttr = `data-rg-orig-${attr}`;
          const val = (el.getAttribute(attr) || '').trim();
          if (!enabled) {
            if (el.hasAttribute(backupAttr)) {
              el.setAttribute(attr, el.getAttribute(backupAttr) || val);
              el.removeAttribute(backupAttr);
            }
            continue;
          }
          const orig = el.hasAttribute(backupAttr) ? el.getAttribute(backupAttr) || val : val;
          const mapped =
            theme === 'dark' && attr === 'fill' && /^#(?:ffffff|fff)$/i.test(orig)
              ? '#212121'
              : map[orig.toLowerCase()];
          if (mapped && val.toLowerCase() !== mapped) {
            if (!el.hasAttribute(backupAttr)) {
              el.setAttribute(backupAttr, val);
            }
            el.setAttribute(attr, mapped);
          }
        }
      }
    } finally {
      isMutating = false;
    }
  }

  function applySandboxState() {
    const root = document.documentElement;
    if (!root) return;

    if (!state.enabled || !isGenUiDocument()) {
      root.removeAttribute('data-rg-sandbox');
      root.removeAttribute('data-rg-theme');
      root.style.removeProperty('--rg-font-size');
      harmonizeWidgetDom(false, 'light');
      if (typeof window.sendHeight === 'function') window.sendHeight();
      return;
    }

    const theme = detectFrameTheme();
    root.setAttribute('data-rg-sandbox', 'true');
    root.setAttribute('data-rg-theme', theme);
    root.style.setProperty('--rg-font-size', state.fontSize || '16px');
    harmonizeWidgetDom(true, theme);
    if (typeof window.sendHeight === 'function') window.sendHeight();
  }

  function notifyParentReady() {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'RG_SANDBOX_READY' }, '*');
      }
    } catch (_) {}
  }

  window.addEventListener('message', (event) => {
    const data = event && event.data;
    if (!data || typeof data !== 'object' || data.type !== 'RG_SANDBOX_SYNC') return;
    if (typeof data.enabled === 'boolean') state.enabled = data.enabled;
    if (data.theme === 'light' || data.theme === 'dark') state.parentTheme = data.theme;
    if (typeof data.themeMode === 'string') state.themeMode = data.themeMode;
    if (typeof data.fontSize === 'string' && data.fontSize) state.fontSize = data.fontSize;
    applySandboxState();
  });

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      if (chrome.runtime && chrome.runtime.lastError) return;
      if (stored && typeof stored === 'object') {
        state.enabled = stored.enabled !== false;
        state.themeMode = stored.themeMode || 'auto';
        state.fontSize = stored.fontSize || '16px';
        applySandboxState();
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (changes.enabled) state.enabled = changes.enabled.newValue !== false;
      if (changes.themeMode) state.themeMode = changes.themeMode.newValue || 'auto';
      if (changes.fontSize) state.fontSize = changes.fontSize.newValue || '16px';
      applySandboxState();
    });
  }

  let rafPending = false;
  const scheduleRefresh = () => {
    if (isMutating || rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      applySandboxState();
    });
  };

  function startObserver() {
    if (!document.documentElement) return;
    applySandboxState();
    notifyParentReady();
    const mo = new MutationObserver(scheduleRefresh);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.documentElement) {
    startObserver();
  }
  document.addEventListener('DOMContentLoaded', () => {
    applySandboxState();
    notifyParentReady();
  });
})();
