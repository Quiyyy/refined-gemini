/**
 * Refined Gemini — Generative UI Sandbox Content Script
 *
 * Runs strictly inside embedded Generative UI sandbox subframes:
 *   - Angular <genui-sandbox> about:srcdoc iframes (initiated by gemini.google.com)
 *   - Angular <sandbox-frame> & React Islands <safe-content-frame> (*.scf.usercontent.goog)
 *   - Legacy sandbox subframes (*.googleusercontent.com)
 *
 * Synchronizes ChatGPT Light/Dark theme tokens, uniform typography, and reversible
 * Google-to-ChatGPT palette harmonization on interactive diagrams, steppers & SVG topologies.
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
    isUserPreview: false,
    themeMode: DEFAULTS.themeMode || 'auto',
    parentTheme: null,
    fontSize: DEFAULTS.fontSize || '16px'
  };

  // Curated Google M3 / Luminous (Cgk) GenUI hex -> ChatGPT Light & Dark hex maps
  const LIGHT_HEX_MAP = {
    '#3186ff': '#0285ff',
    '#1a73e8': '#0285ff',
    '#4285f4': '#0285ff',
    '#3b82f6': '#0285ff',
    '#0b57d0': '#0169cc',
    '#0e57d0': '#0169cc',
    '#1967d2': '#0169cc',
    '#174ea6': '#0169cc',
    '#2563eb': '#0169cc',
    '#041e49': '#0d0d0d',
    '#001d35': '#0d0d0d',
    '#dcf1ff': '#e5f3ff',
    '#d3e3fd': '#e5f3ff',
    '#e8f0fe': '#e5f3ff',
    '#d2e3fc': '#e5f3ff',
    '#dbeafe': '#e5f3ff',
    '#eff6ff': '#e5f3ff',
    '#9dd2ff': '#99ceff',
    '#a8c7fa': '#99ceff',
    '#fdfcfc': '#ffffff',
    '#f2f0f0': '#f7f7f8',
    '#f4f3f2': '#f7f7f8',
    '#f4f3f0': '#f7f7f8',
    '#f7f6f6': '#f7f7f8',
    '#faf9f9': '#f9f9f9',
    '#f0f4f9': '#f7f7f8',
    '#e8eef6': '#f4f4f4',
    '#dde3e9': '#ececec',
    '#f1f3f4': '#f4f4f4',
    '#f8f9fa': '#f7f7f8',
    '#1f1f1f': '#0d0d0d',
    '#3c4043': '#0d0d0d',
    '#444746': '#5d5d5d',
    '#5f6368': '#5d5d5d',
    '#747775': '#8f8f8f'
  };

  const DARK_HEX_MAP = {
    '#3186ff': '#0285ff',
    '#1a73e8': '#0285ff',
    '#4285f4': '#0285ff',
    '#3b82f6': '#0285ff',
    '#0b57d0': '#66b5ff',
    '#0e57d0': '#66b5ff',
    '#1967d2': '#66b5ff',
    '#174ea6': '#66b5ff',
    '#2563eb': '#66b5ff',
    '#a8c7fa': '#66b5ff',
    '#a7c7fa': '#66b5ff',
    '#8ab4f8': '#66b5ff',
    '#93c5fd': '#66b5ff',
    '#dcf1ff': '#1a3550',
    '#d3e3fd': '#1a3550',
    '#e8f0fe': '#1a3550',
    '#d2e3fc': '#1a3550',
    '#dbeafe': '#1a3550',
    '#eff6ff': '#1a3550',
    '#0842a0': '#1a3550',
    '#0842a1': '#1a3550',
    '#192967': '#1a3550',
    '#1e3a8a': '#1a3550',
    '#fdfcfc': '#212121',
    '#0f0f0f': '#212121',
    '#1b1b1b': '#212121',
    '#f2f0f0': '#2a2a2a',
    '#f4f3f2': '#2a2a2a',
    '#f4f3f0': '#2a2a2a',
    '#f7f6f6': '#2a2a2a',
    '#faf9f9': '#262626',
    '#fafafa': '#262626',
    '#f0f4f9': '#2a2a2a',
    '#f8f9fa': '#262626',
    '#f1f3f4': '#2f2f2f',
    '#e8eef6': '#2f2f2f',
    '#dde3e9': '#383838',
    '#dadce0': '#3c3c3c',
    '#e0e0e0': '#3c3c3c',
    '#cccccc': '#3c3c3c',
    '#282a2c': '#2a2a2a',
    '#202021': '#171717',
    '#2a2b2c': '#2f2f2f',
    '#041e49': '#ececec',
    '#001d35': '#ececec',
    '#1f1f1f': '#ececec',
    '#202124': '#ececec',
    '#111827': '#ececec',
    '#1f2937': '#ececec',
    '#374151': '#ececec',
    '#3c4043': '#ececec',
    '#e3e3e3': '#ececec',
    '#e6e6e6': '#ececec',
    '#444746': '#b4b4b4',
    '#4b5563': '#b4b4b4',
    '#5f6368': '#b4b4b4',
    '#6b7280': '#b4b4b4',
    '#c4c7c5': '#b4b4b4',
    '#747775': '#8e8ea0'
  };

  function isUserPreviewContext() {
    if (state.isUserPreview) return true;
    try {
      let cur = window.frameElement;
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
    } catch (_) {}
    return false;
  }

  function isGenUiDocument() {
    if (isUserPreviewContext()) return false;
    if (isScfHost) return true;
    // Matches Angular <genui-sandbox> srcdoc frames, chart runtimes, and GenUI containers
    // while ignoring unrelated analytics/GTM iframes and user-authored <web-preview>.
    if (
      document.getElementById('app-root') ||
      document.getElementById('genui-host-injected-css') ||
      document.querySelector(
        '.bot-response, script[data-sandbox-runtime], .vega-embed, .google-visualization-container, svg.marks'
      )
    ) {
      return true;
    }
    if (location.protocol === 'about:' && typeof window.genuiStreamingActive !== 'undefined') {
      return true;
    }
    try {
      if (
        window.frameElement &&
        (window.frameElement.getAttribute('title') === 'Model Generated UI Container' ||
          window.frameElement.closest(
            'genui-sandbox, gen-ui-html, sandbox-frame, generative-ui-frame, mcp-tool-ui-frame, deep-zoom, mini-app, vega-lite-chart, google-chart, [data-testid="gen-ui-html-node"]'
          ))
      ) {
        return true;
      }
    } catch (_) {}
    return false;
  }

  function detectFrameTheme() {
    if (state.themeMode === 'light' || state.themeMode === 'dark') {
      return state.themeMode;
    }
    if (state.parentTheme === 'light' || state.parentTheme === 'dark') {
      return state.parentTheme;
    }
    if (document.body) {
      if (document.body.classList.contains('dark-theme') || document.body.getAttribute('data-theme') === 'dark') {
        return 'dark';
      }
      if (document.body.classList.contains('light-theme') || document.body.getAttribute('data-theme') === 'light') {
        return 'light';
      }
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
    // Remap translucent Google Blue rgba(49, 134, 255, a) / rgba(26, 115, 232, a) -> ChatGPT #0285FF
    out = out.replace(
      /rgba?\(\s*(?:49\s*,\s*134\s*,\s*255|26\s*,\s*115\s*,\s*232|66\s*,\s*133\s*,\s*244)(\s*(?:,\s*[^)]+)?)\)/gi,
      'rgba(2, 133, 255$1)'
    );
    if (theme === 'dark') {
      out = out.replace(
        /(background(?:-color)?\s*:\s*)#(?:ffffff|fff)\b/gi,
        '$1#262626'
      );
    }
    // Harmonize oversized GenUI heading/callout font-sizes (17px–28px / 1.05rem–1.85rem) to --rg-font-size
    out = out.replace(
      /font-size\s*:\s*(?:1[789]|2[0-8])(?:\.\d+)?px\b/gi,
      'font-size: var(--rg-font-size, 16px)'
    );
    out = out.replace(
      /font-size\s*:\s*1\.(?:0[5-9]|[1-8]\d*)(?:rem|em)\b/gi,
      'font-size: var(--rg-font-size, 16px)'
    );
    // Tighten bulky Material 16px–32px card radii to crisp ChatGPT 12px (leaves 999px/50% pills untouched)
    out = out.replace(
      /border-radius\s*:\s*(?:1[6-9]|2\d|3[0-2])(?:\.\d+)?px\b/gi,
      'border-radius: 12px'
    );
    return out;
  }

  let isMutating = false;

  function harmonizeWidgetDom(enabled, theme) {
    if (!document.documentElement) return;
    isMutating = true;
    try {
      // 1. Style tags (including #genui-host-injected-css and model <style> blocks)
      const styles = document.querySelectorAll('style:not([data-rg-own-style])');
      for (const styleEl of styles) {
        const current = styleEl.textContent || '';
        if (styleEl.__rgOrigCss === undefined || (!enabled && styleEl.__rgLastOut !== current)) {
          styleEl.__rgOrigCss = current;
        } else if (enabled && styleEl.__rgLastOut !== undefined && styleEl.__rgLastOut !== current) {
          // MorphDom or setHostInjectedCss updated the style tag dynamically
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

      // 2. Inline style="..." attributes inside body (handles script-driven step banners & callouts)
      if (document.body) {
        const styledEls = document.body.querySelectorAll('[style]');
        for (const el of styledEls) {
          const backupAttr = 'data-rg-orig-style';
          const curStyle = el.getAttribute('style') || '';
          if (!enabled) {
            if (el.hasAttribute(backupAttr)) {
              el.setAttribute('style', el.getAttribute(backupAttr) || '');
              el.removeAttribute(backupAttr);
            }
            el.__rgLastStyle = undefined;
            continue;
          }
          if (el.__rgLastStyle !== undefined && curStyle !== el.__rgLastStyle) {
            el.setAttribute(backupAttr, curStyle);
          } else if (!el.hasAttribute(backupAttr)) {
            el.setAttribute(backupAttr, curStyle);
          }
          const origStyle = el.getAttribute(backupAttr) || curStyle;
          const nextStyle = transformWidgetCss(origStyle, theme);
          if (curStyle !== nextStyle) {
            el.setAttribute('style', nextStyle);
          }
          el.__rgLastStyle = nextStyle;
        }
      }

      // 3. SVG presentation attributes (fill / stroke, tracking interactive step clicks cleanly)
      const map = theme === 'dark' ? DARK_HEX_MAP : LIGHT_HEX_MAP;
      const svgNodes = document.querySelectorAll('svg [fill], svg [stroke]');
      for (const el of svgNodes) {
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
            // Interactive widget JS mutated fill/stroke (e.g., clicking Next Step or an SVG node)
            el.setAttribute(backupAttr, val);
          }
          const orig = el.hasAttribute(backupAttr) ? el.getAttribute(backupAttr) || val : val;
          const lowerOrig = orig.toLowerCase();
          let mapped = map[lowerOrig];
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

      // 4. Promote borderless #f2f0f0 / var(--bg-secondary) callout blocks inside #app-root to crisp 1px cards
      const appRoot = document.getElementById('app-root');
      if (appRoot) {
        const blocks = appRoot.querySelectorAll('div, section, aside, header');
        for (const blk of blocks) {
          if (!enabled) {
            if (blk.classList.contains('rg-sb-card-surface')) {
              blk.classList.remove('rg-sb-card-surface');
            }
            continue;
          }
          if (blk.classList.contains('rg-sb-card-surface') || blk.id === 'app-root') continue;
          const cs = window.getComputedStyle(blk);
          const bg = cs.backgroundColor;
          const bw = parseFloat(cs.borderTopWidth || '0');
          const br = parseFloat(cs.borderTopLeftRadius || '0');
          // Catch warm/cool secondary callout boxes (like "步骤 1：多端指令接入") that have rounded fill but 0px border
          if (
            bw === 0 &&
            br >= 8 &&
            br < 40 &&
            (bg === 'rgb(247, 247, 248)' ||
              bg === 'rgb(249, 249, 249)' ||
              bg === 'rgb(242, 240, 240)' ||
              bg === 'rgb(42, 42, 42)')
          ) {
            blk.classList.add('rg-sb-card-surface');
          }
        }
      }
    } finally {
      queueMicrotask(() => {
        isMutating = false;
      });
    }
  }

  function applySandboxState() {
    const root = document.documentElement;
    if (!root) return;

    isMutating = true;
    try {
      if (!state.enabled || !isGenUiDocument()) {
        if (root.hasAttribute('data-rg-sandbox')) root.removeAttribute('data-rg-sandbox');
        if (root.hasAttribute('data-rg-theme')) root.removeAttribute('data-rg-theme');
        if (root.style.getPropertyValue('--rg-font-size')) root.style.removeProperty('--rg-font-size');
        harmonizeWidgetDom(false, 'light');
        if (typeof window.sendHeight === 'function') window.sendHeight();
        return;
      }

      const theme = detectFrameTheme();
      const fontSize = state.fontSize || '16px';
      if (root.getAttribute('data-rg-sandbox') !== 'true') {
        root.setAttribute('data-rg-sandbox', 'true');
      }
      if (root.getAttribute('data-rg-theme') !== theme) {
        root.setAttribute('data-rg-theme', theme);
      }
      if (root.style.getPropertyValue('--rg-font-size') !== fontSize) {
        root.style.setProperty('--rg-font-size', fontSize);
      }
      harmonizeWidgetDom(true, theme);
      if (typeof window.sendHeight === 'function') window.sendHeight();
    } finally {
      queueMicrotask(() => {
        isMutating = false;
      });
    }
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
    if (typeof data.isUserPreview === 'boolean') state.isUserPreview = data.isUserPreview;
    if (typeof data.enabled === 'boolean') state.enabled = data.enabled;
    if (data.theme === 'light' || data.theme === 'dark') state.parentTheme = data.theme;
    if (typeof data.themeMode === 'string') state.themeMode = data.themeMode;
    if (typeof data.fontSize === 'string' && data.fontSize) state.fontSize = data.fontSize;
    applySandboxState();
  });

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    try {
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
    } catch (_) {}
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

  let observerStarted = false;
  function startObserver() {
    if (observerStarted || !document.documentElement) return;
    observerStarted = true;
    applySandboxState();
    notifyParentReady();
    const mo = new MutationObserver(scheduleRefresh);
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['fill', 'stroke', 'style', 'class']
    });
  }

  if (document.documentElement) {
    startObserver();
  } else {
    const bootTimer = setInterval(() => {
      if (document.documentElement) {
        clearInterval(bootTimer);
        startObserver();
      }
    }, 10);
  }

  document.addEventListener('DOMContentLoaded', () => {
    startObserver();
    applySandboxState();
    notifyParentReady();
  });

  window.addEventListener('load', () => {
    applySandboxState();
    notifyParentReady();
  });
})();
