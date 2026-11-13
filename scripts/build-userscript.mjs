#!/usr/bin/env node
/**
 * Builds userscript/refined-gemini.user.js directly from src/content.css & src/sandbox.css,
 * producing a Greasy Fork & ScriptCat compliant bilingual UserScript with
 * 100% visual & interactive parity (including Generative UI sandbox frames)
 * with the Manifest V3 browser extension.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const cssContent = fs.readFileSync(path.join(ROOT, 'src/content.css'), 'utf8');
const sandboxCssContent = fs.readFileSync(path.join(ROOT, 'src/sandbox.css'), 'utf8');
const outDir = path.join(ROOT, 'userscript');
fs.mkdirSync(outDir, { recursive: true });

const userScript = `// ==UserScript==
// @name               Refined Gemini — 1:1 ChatGPT Web UI Alignment
// @name:zh-CN         Refined Gemini — 1:1 对齐 ChatGPT 网页端界面
// @name:zh-TW         Refined Gemini — 1:1 對齊 ChatGPT 網頁端介面
// @namespace          https://github.com/Quiyyy/refined-gemini
// @version            ${pkg.version}
// @description        Align Google Gemini Web UI 1:1 with ChatGPT: uniform typography, clean white/dark surfaces, soft-blue user bubbles, #0285FF accents, and unified management of all 80+ Gemini widgets & diagrams.
// @description:zh-CN  1:1 对齐 ChatGPT 网页端视觉与排版：全局统一字号、纯白/深灰画布、浅蓝用户气泡与 #0285FF 强调色、80+ 原生组件卡片与交互式图表同源管理。
// @description:zh-TW  1:1 對齊 ChatGPT 網頁端視覺與排版：全域統一字級、純白/深灰畫布、淺藍用戶氣泡與 #0285FF 強調色、80+ 原生組件卡片與互動式圖表同源管理。
// @author             Quiyyy
// @license            MIT
// @homepageURL        https://github.com/Quiyyy/refined-gemini
// @supportURL         https://github.com/Quiyyy/refined-gemini/issues
// @icon               https://raw.githubusercontent.com/Quiyyy/refined-gemini/main/icons/icon128.png
// @match              https://gemini.google.com/*
// @match              https://*.scf.usercontent.goog/*
// @match              https://*.googleusercontent.com/*
// @run-at             document-start
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'refined_gemini_settings_v1';
  const DEFAULTS = {
    enabled: true,
    uiLang: 'auto',         // 'auto' | 'zh' | 'en'
    themeMode: 'auto',      // 'auto' | 'light' | 'dark'
    chatWidth: '800px',     // '800px' (768px prose) | '920px' | '1120px' | '90%'
    fontSize: '16px',       // '15px' | '16px' | '17px'
    indentScale: '1',       // '0' | '0.65' | '1' (GPT default) | '1.25'
    hideAvatar: true,
    compactSidebar: true,
    cleanView: true,
    ctrlEnterSend: false
  };

  const VALID_INDENT_SCALES = new Set(['0', '0.65', '1', '1.25']);
  const VALID_LANGS = new Set(['auto', 'zh', 'en']);
  const CSS = ${JSON.stringify(cssContent)};
  const SANDBOX_CSS = ${JSON.stringify(sandboxCssContent)};

  const LIGHT_MAP = {
    '#3186ff': '#0285ff', '#1a73e8': '#0285ff', '#4285f4': '#0285ff', '#3b82f6': '#0285ff',
    '#0b57d0': '#0169cc', '#0e57d0': '#0169cc', '#1967d2': '#0169cc', '#174ea6': '#0169cc', '#2563eb': '#0169cc',
    '#041e49': '#0d0d0d', '#001d35': '#0d0d0d',
    '#dcf1ff': '#e5f3ff', '#d3e3fd': '#e5f3ff', '#e8f0fe': '#e5f3ff', '#d2e3fc': '#e5f3ff', '#dbeafe': '#e5f3ff', '#eff6ff': '#e5f3ff',
    '#9dd2ff': '#99ceff', '#a8c7fa': '#99ceff',
    '#fdfcfc': '#ffffff', '#f2f0f0': '#f7f7f8', '#f4f3f2': '#f7f7f8', '#f4f3f0': '#f7f7f8', '#f7f6f6': '#f7f7f8',
    '#faf9f9': '#f9f9f9', '#f0f4f9': '#f7f7f8', '#f8f9fa': '#f7f7f8',
    '#e8eef6': '#f4f4f4', '#dde3e9': '#ececec', '#f1f3f4': '#f4f4f4',
    '#1f1f1f': '#0d0d0d', '#3c4043': '#0d0d0d', '#444746': '#5d5d5d', '#5f6368': '#5d5d5d', '#747775': '#8f8f8f'
  };
  const DARK_MAP = {
    '#3186ff': '#0285ff', '#1a73e8': '#0285ff', '#4285f4': '#0285ff', '#3b82f6': '#0285ff',
    '#0b57d0': '#66b5ff', '#0e57d0': '#66b5ff', '#1967d2': '#66b5ff', '#174ea6': '#66b5ff', '#2563eb': '#66b5ff', '#a8c7fa': '#66b5ff', '#a7c7fa': '#66b5ff', '#8ab4f8': '#66b5ff', '#93c5fd': '#66b5ff',
    '#dcf1ff': '#1a3550', '#d3e3fd': '#1a3550', '#e8f0fe': '#1a3550', '#d2e3fc': '#1a3550', '#dbeafe': '#1a3550', '#eff6ff': '#1a3550',
    '#0842a0': '#1a3550', '#0842a1': '#1a3550', '#192967': '#1a3550', '#1e3a8a': '#1a3550',
    '#fdfcfc': '#212121', '#0f0f0f': '#212121', '#1b1b1b': '#212121',
    '#f2f0f0': '#2a2a2a', '#f4f3f2': '#2a2a2a', '#f4f3f0': '#2a2a2a', '#f7f6f6': '#2a2a2a',
    '#faf9f9': '#262626', '#fafafa': '#262626', '#f0f4f9': '#2a2a2a',
    '#f8f9fa': '#262626', '#f1f3f4': '#2f2f2f', '#e8eef6': '#2f2f2f', '#dde3e9': '#383838', '#dadce0': '#3c3c3c', '#e0e0e0': '#3c3c3c', '#cccccc': '#3c3c3c',
    '#282a2c': '#2a2a2a', '#202021': '#171717', '#2a2b2c': '#2f2f2f',
    '#041e49': '#ececec', '#001d35': '#ececec', '#1f1f1f': '#ececec', '#111827': '#ececec', '#1f2937': '#ececec', '#374151': '#ececec', '#3c4043': '#ececec',
    '#202124': '#ececec', '#e3e3e3': '#ececec', '#e6e6e6': '#ececec', '#444746': '#b4b4b4', '#4b5563': '#b4b4b4', '#5f6368': '#b4b4b4', '#6b7280': '#b4b4b4', '#c4c7c5': '#b4b4b4', '#747775': '#8e8ea0'
  };

  function isUserPreviewEl(frame) {
    let cur = frame;
    while (cur && cur.nodeType === 1) {
      if (
        typeof cur.matches === 'function' &&
        cur.matches('web-preview, [data-testid*="web-preview"], immersive-panel:not(:has(deep-research-immersive-panel))')
      ) {
        return true;
      }
      const root = typeof cur.getRootNode === 'function' ? cur.getRootNode() : null;
      cur = cur.parentElement || (root && root.host ? root.host : null);
    }
    return false;
  }

  function normalize(obj) {
    const merged = { ...DEFAULTS, ...(obj || {}) };
    if (merged.chatWidth === '768px') merged.chatWidth = '800px';
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

  function resolveLang(uiLang) {
    if (uiLang === 'zh' || uiLang === 'en') return uiLang;
    return String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  function readSettings() {
    try {
      if (typeof GM_getValue === 'function') {
        const saved = GM_getValue(STORAGE_KEY, null);
        if (saved && typeof saved === 'object') return normalize(saved);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (_) {}
    return { ...DEFAULTS };
  }

  function saveSettings(next) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(STORAGE_KEY, next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
  }

  let settings = readSettings();
  const host = String(location.hostname || '').toLowerCase();

  // --- Generative UI Sandbox Subframe Branch (about:srcdoc, *.scf.usercontent.goog, *.googleusercontent.com) ---
  if (window !== window.top) {
    if (host.startsWith('feedback') || host.includes('accounts.google') || host.includes('uservoice')) return;

    const isScf = host.endsWith('.scf.usercontent.goog') || host === 'scf.usercontent.goog';
    let sbState = {
      enabled: Boolean(settings.enabled),
      isUserPreview: false,
      themeMode: settings.themeMode || 'auto',
      parentTheme: null,
      fontSize: settings.fontSize || '16px'
    };

    function transformCss(cssText, theme) {
      const map = theme === 'dark' ? DARK_MAP : LIGHT_MAP;
      let out = cssText
        .replace(/#[0-9a-fA-F]{6}\\b/g, (h) => map[h.toLowerCase()] || h)
        .replace(/rgba?\\(\\s*(?:49\\s*,\\s*134\\s*,\\s*255|26\\s*,\\s*115\\s*,\\s*232|66\\s*,\\s*133\\s*,\\s*244)(\\s*(?:,\\s*[^)]+)?)\\)/gi, 'rgba(2, 133, 255$1)')
        .replace(/font-size\\s*:\\s*(?:1[789]|2[0-8])(?:\\.\\d+)?px\\b/gi, 'font-size: var(--rg-font-size, 16px)')
        .replace(/font-size\\s*:\\s*1\\.(?:0[5-9]|[1-8]\\d*)(?:rem|em)\\b/gi, 'font-size: var(--rg-font-size, 16px)')
        .replace(/border-radius\\s*:\\s*(?:1[6-9]|2\\d|3[0-2])(?:\\.\\d+)?px\\b/gi, 'border-radius: 12px');
      if (theme === 'dark') {
        out = out.replace(/(background(?:-color)?\\s*:\\s*)#(?:ffffff|fff)\\b/gi, '$1#262626');
      }
      return out;
    }

    function injectSandboxStyle() {
      if (document.getElementById('refined-gemini-sandbox-style')) return;
      const st = document.createElement('style');
      st.id = 'refined-gemini-sandbox-style';
      st.setAttribute('data-rg-own-style', 'true');
      st.textContent = SANDBOX_CSS;
      (document.head || document.documentElement).appendChild(st);
    }

    let sbMutating = false;
    function applySandbox() {
      const root = document.documentElement;
      if (!root) return;
      let userPreview = sbState.isUserPreview;
      if (!userPreview) {
        try { userPreview = Boolean(window.frameElement && isUserPreviewEl(window.frameElement)); } catch (_) {}
      }
      let frameIsGenUi = false;
      try {
        frameIsGenUi = Boolean(
          window.frameElement &&
          (window.frameElement.getAttribute('title') === 'Model Generated UI Container' ||
            window.frameElement.closest('genui-sandbox, gen-ui-html, sandbox-frame, generative-ui-frame, mcp-tool-ui-frame, deep-zoom, mini-app, vega-lite-chart, google-chart, [data-testid="gen-ui-html-node"]'))
        );
      } catch (_) {}
      const isGenUi = !userPreview && (isScf || frameIsGenUi || Boolean(
        document.getElementById('app-root') ||
        document.getElementById('genui-host-injected-css') ||
        document.querySelector('.bot-response, script[data-sandbox-runtime], .vega-embed, .google-visualization-container, svg.marks') ||
        (location.protocol === 'about:' && typeof window.genuiStreamingActive !== 'undefined')
      ));
      sbMutating = true;
      try {
        if (!sbState.enabled || !isGenUi) {
          if (root.hasAttribute('data-rg-sandbox')) root.removeAttribute('data-rg-sandbox');
          if (root.hasAttribute('data-rg-theme')) root.removeAttribute('data-rg-theme');
          if (root.style.getPropertyValue('--rg-font-size')) root.style.removeProperty('--rg-font-size');
          for (const s of document.querySelectorAll('style:not([data-rg-own-style])')) {
            if (s.__rgOrig !== undefined && s.textContent !== s.__rgOrig) s.textContent = s.__rgOrig;
            s.__rgOut = undefined;
          }
          if (document.body) {
            for (const el of document.body.querySelectorAll('[data-rg-orig-style]')) {
              el.setAttribute('style', el.getAttribute('data-rg-orig-style') || '');
              el.removeAttribute('data-rg-orig-style');
              el.__rgLastStyle = undefined;
            }
          }
          for (const el of document.querySelectorAll('svg [data-rg-orig-fill], svg [data-rg-orig-stroke]')) {
            for (const attr of ['fill', 'stroke']) {
              const bAttr = 'data-rg-orig-' + attr;
              if (el.hasAttribute(bAttr)) {
                el.setAttribute(attr, el.getAttribute(bAttr) || '');
                el.removeAttribute(bAttr);
              }
              el[attr === 'fill' ? '__rgLastFill' : '__rgLastStroke'] = undefined;
            }
          }
          for (const blk of document.querySelectorAll('.rg-sb-card-surface')) {
            blk.classList.remove('rg-sb-card-surface');
          }
          if (typeof window.sendHeight === 'function') window.sendHeight();
          return;
        }
        injectSandboxStyle();
        const theme = (sbState.themeMode === 'light' || sbState.themeMode === 'dark')
          ? sbState.themeMode
          : (sbState.parentTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
        const fontSize = sbState.fontSize || '16px';
        if (root.getAttribute('data-rg-sandbox') !== 'true') root.setAttribute('data-rg-sandbox', 'true');
        if (root.getAttribute('data-rg-theme') !== theme) root.setAttribute('data-rg-theme', theme);
        if (root.style.getPropertyValue('--rg-font-size') !== fontSize) root.style.setProperty('--rg-font-size', fontSize);
        const map = theme === 'dark' ? DARK_MAP : LIGHT_MAP;
        for (const s of document.querySelectorAll('style:not([data-rg-own-style])')) {
          const cur = s.textContent || '';
          if (s.__rgOrig === undefined || (s.__rgOut !== undefined && s.__rgOut !== cur)) s.__rgOrig = cur;
          const next = transformCss(s.__rgOrig, theme);
          if (cur !== next) s.textContent = next;
          s.__rgOut = next;
        }
        if (document.body) {
          for (const el of document.body.querySelectorAll('[style]')) {
            const bAttr = 'data-rg-orig-style';
            const cur = el.getAttribute('style') || '';
            if (el.__rgLastStyle !== undefined && cur !== el.__rgLastStyle) el.setAttribute(bAttr, cur);
            else if (!el.hasAttribute(bAttr)) el.setAttribute(bAttr, cur);
            const next = transformCss(el.getAttribute(bAttr) || cur, theme);
            if (cur !== next) el.setAttribute('style', next);
            el.__rgLastStyle = next;
          }
        }
        for (const el of document.querySelectorAll('svg [fill], svg [stroke]')) {
          const tag = (el.tagName || '').toLowerCase();
          const isText = tag === 'text' || tag === 'tspan';
          for (const attr of ['fill', 'stroke']) {
            if (!el.hasAttribute(attr)) continue;
            const bAttr = 'data-rg-orig-' + attr;
            const lProp = attr === 'fill' ? '__rgLastFill' : '__rgLastStroke';
            const val = (el.getAttribute(attr) || '').trim();
            if (el[lProp] !== undefined && val !== el[lProp]) el.setAttribute(bAttr, val);
            const orig = el.hasAttribute(bAttr) ? (el.getAttribute(bAttr) || val) : val;
            let mapped = map[orig.toLowerCase()];
            if (!mapped && theme === 'dark') {
              if (attr === 'fill' && /^#(?:ffffff|fff)$/i.test(orig) && !isText) mapped = '#262626';
              else if ((isText || attr === 'stroke') && /^#(?:000000|000)$/i.test(orig)) mapped = '#ececec';
            }
            if (mapped && val.toLowerCase() !== mapped) {
              if (!el.hasAttribute(bAttr)) el.setAttribute(bAttr, orig);
              el.setAttribute(attr, mapped);
              el[lProp] = mapped;
            } else {
              el[lProp] = val;
            }
          }
        }
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
          for (const blk of appRoot.querySelectorAll('div, section, aside, header')) {
            if (blk.classList.contains('rg-sb-card-surface') || blk.id === 'app-root') continue;
            const cs = window.getComputedStyle(blk);
            if (
              parseFloat(cs.borderTopWidth || '0') === 0 &&
              parseFloat(cs.borderTopLeftRadius || '0') >= 8 &&
              (cs.backgroundColor === 'rgb(247, 247, 248)' ||
                cs.backgroundColor === 'rgb(242, 240, 240)' ||
                cs.backgroundColor === 'rgb(42, 42, 42)')
            ) {
              blk.classList.add('rg-sb-card-surface');
            }
          }
        }
        if (typeof window.sendHeight === 'function') window.sendHeight();
      } finally {
        queueMicrotask(() => {
          sbMutating = false;
        });
      }
    }

    window.addEventListener('message', (e) => {
      const d = e && e.data;
      if (!d || d.type !== 'RG_SANDBOX_SYNC') return;
      if (typeof d.isUserPreview === 'boolean') sbState.isUserPreview = d.isUserPreview;
      if (typeof d.enabled === 'boolean') sbState.enabled = d.enabled;
      if (d.theme === 'light' || d.theme === 'dark') sbState.parentTheme = d.theme;
      if (typeof d.themeMode === 'string') sbState.themeMode = d.themeMode;
      if (typeof d.fontSize === 'string') sbState.fontSize = d.fontSize;
      applySandbox();
    });

    let sbRaf = false;
    const startSbObs = () => {
      if (!document.documentElement) return;
      applySandbox();
      try { window.parent.postMessage({ type: 'RG_SANDBOX_READY' }, '*'); } catch (_) {}
      new MutationObserver(() => {
        if (sbMutating || sbRaf) return;
        sbRaf = true;
        requestAnimationFrame(() => { sbRaf = false; applySandbox(); });
      }).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['fill', 'stroke', 'style', 'class']
      });
    };

    if (document.documentElement) startSbObs();
    document.addEventListener('DOMContentLoaded', () => {
      startSbObs();
      applySandbox();
      try { window.parent.postMessage({ type: 'RG_SANDBOX_READY' }, '*'); } catch (_) {}
    });
    return;
  }

  if (host !== 'gemini.google.com') return;

  // --- Main Host Branch (gemini.google.com) ---
  function injectStyle() {
    if (document.getElementById('refined-gemini-style')) return;
    const style = document.createElement('style');
    style.id = 'refined-gemini-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function detectNativeDark() {
    const body = document.body;
    const docEl = document.documentElement;
    if (body) {
      if (body.classList.contains('dark-theme') || body.getAttribute('data-theme') === 'dark') return true;
      if (body.classList.contains('light-theme') || body.getAttribute('data-theme') === 'light') return false;
    }
    if (docEl && (docEl.classList.contains('dark') || docEl.classList.contains('dark-theme'))) return true;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function resolveTheme() {
    return settings.themeMode === 'auto' ? (detectNativeDark() ? 'dark' : 'light') : settings.themeMode;
  }

  let isInlineSvgMutating = false;
  function harmonizeInlineDiagrams() {
    if (!document.body) return;
    const enabled = Boolean(settings.enabled);
    const theme = resolveTheme();
    const map = theme === 'dark' ? DARK_MAP : LIGHT_MAP;
    isInlineSvgMutating = true;
    try {
      const svgs = document.body.querySelectorAll(
        ':is(svg-code-block, .svg-preview, vega-lite-chart, google-chart, deep-zoom, gen-ui-html):not(web-preview *) svg'
      );
      for (const svg of svgs) {
        if (svg.closest('web-preview')) continue;
        for (const el of svg.querySelectorAll('[fill], [stroke]')) {
          const tag = (el.tagName || '').toLowerCase();
          const isText = tag === 'text' || tag === 'tspan';
          for (const attr of ['fill', 'stroke']) {
            if (!el.hasAttribute(attr)) continue;
            const bAttr = 'data-rg-orig-' + attr;
            const lProp = attr === 'fill' ? '__rgLastFill' : '__rgLastStroke';
            const val = (el.getAttribute(attr) || '').trim();
            if (!enabled) {
              if (el.hasAttribute(bAttr)) {
                el.setAttribute(attr, el.getAttribute(bAttr) || val);
                el.removeAttribute(bAttr);
              }
              el[lProp] = undefined;
              continue;
            }
            if (el[lProp] !== undefined && val !== el[lProp]) el.setAttribute(bAttr, val);
            const orig = el.hasAttribute(bAttr) ? (el.getAttribute(bAttr) || val) : val;
            let mapped = map[orig.toLowerCase()];
            if (!mapped && theme === 'dark') {
              if (attr === 'fill' && /^#(?:ffffff|fff)$/i.test(orig) && !isText) mapped = '#262626';
              else if ((isText || attr === 'stroke') && /^#(?:000000|000)$/i.test(orig)) mapped = '#ececec';
            }
            if (mapped && val.toLowerCase() !== mapped) {
              if (!el.hasAttribute(bAttr)) el.setAttribute(bAttr, orig);
              el.setAttribute(attr, mapped);
              el[lProp] = mapped;
            } else {
              el[lProp] = val;
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

  const boundFrames = new WeakSet();
  function buildPayload(userPreview) {
    return {
      type: 'RG_SANDBOX_SYNC',
      enabled: Boolean(settings.enabled) && !userPreview,
      isUserPreview: Boolean(userPreview),
      theme: resolveTheme(),
      themeMode: settings.themeMode || 'auto',
      fontSize: settings.fontSize || '16px'
    };
  }

  function broadcastSandbox() {
    const frames = new Set(document.querySelectorAll('iframe'));
    for (const scf of document.querySelectorAll('safe-content-frame, sandbox-frame, generative-ui-frame, mcp-tool-ui-frame, deep-zoom, mini-app, web-preview')) {
      if (scf.shadowRoot) {
        for (const f of scf.shadowRoot.querySelectorAll('iframe')) frames.add(f);
      }
    }
    for (const f of frames) {
      if (!boundFrames.has(f)) {
        boundFrames.add(f);
        f.addEventListener('load', () => {
          try { f.contentWindow && f.contentWindow.postMessage(buildPayload(isUserPreviewEl(f)), '*'); } catch (_) {}
        });
      }
      try { f.contentWindow && f.contentWindow.postMessage(buildPayload(isUserPreviewEl(f)), '*'); } catch (_) {}
    }
  }

  function resetOuterChatScroll() {
    if (!document.body) return;
    const containers = document.querySelectorAll('.chat-container');
    for (const el of containers) {
      if (el.scrollTop !== 0 && el.querySelector('infinite-scroller.chat-history')) {
        el.scrollTop = 0;
      }
    }
  }

  function apply() {
    injectStyle();
    const root = document.documentElement;
    if (!root) return;
    if (!settings.enabled) {
      root.setAttribute('data-rg-enabled', 'false');
      root.removeAttribute('data-rg-indent');
      root.style.removeProperty('--rg-chat-max-width');
      root.style.removeProperty('--rg-font-size');
      root.style.removeProperty('--rg-indent-scale');
      harmonizeInlineDiagrams();
      broadcastSandbox();
      return;
    }
    const theme = resolveTheme();
    const indentScale = settings.indentScale || DEFAULTS.indentScale;
    root.setAttribute('data-rg-enabled', 'true');
    root.setAttribute('data-rg-theme', theme);
    root.setAttribute('data-rg-indent', indentScale === '0' ? 'none' : 'scaled');
    root.setAttribute('data-rg-hide-avatar', String(Boolean(settings.hideAvatar)));
    root.setAttribute('data-rg-compact-sidebar', String(Boolean(settings.compactSidebar)));
    root.setAttribute('data-rg-clean-view', String(Boolean(settings.cleanView)));
    root.setAttribute('data-rg-ctrl-enter', String(Boolean(settings.ctrlEnterSend)));
    root.style.setProperty('--rg-chat-max-width', settings.chatWidth);
    root.style.setProperty('--rg-font-size', settings.fontSize);
    root.style.setProperty('--rg-indent-scale', indentScale);
    resetOuterChatScroll();
    harmonizeInlineDiagrams();
    broadcastSandbox();
  }

  window.addEventListener('message', (e) => {
    if (e && e.data && e.data.type === 'RG_SANDBOX_READY') broadcastSandbox();
  });

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
  window.addEventListener(
    'keydown',
    (event) => {
      if (!settings.enabled || !settings.ctrlEnterSend) return;
      if (bypassedEvents.has(event)) return;
      if (event.key !== 'Enter') return;
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

      if (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const target = event.target;
        if (target instanceof HTMLTextAreaElement) {
          const start = target.selectionStart ?? target.value.length;
          const end = target.selectionEnd ?? target.value.length;
          target.setRangeText('\\n', start, end, 'end');
          target.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          document.execCommand('insertParagraph', false);
        }
      }
    },
    true
  );

  const obs = new MutationObserver(() => {
    injectStyle();
    if (settings.enabled && settings.themeMode === 'auto') apply();
  });

  function bootstrapRoot() {
    if (!document.documentElement) {
      setTimeout(bootstrapRoot, 0);
      return;
    }
    apply();
    obs.observe(document.documentElement, {
      attributes: true,
      childList: true,
      attributeFilter: ['class', 'data-theme']
    });
  }

  bootstrapRoot();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      new MutationObserver(() => {
        if (isInlineSvgMutating) return;
        requestAnimationFrame(() => {
          harmonizeInlineDiagrams();
          broadcastSandbox();
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  });

  if (typeof GM_registerMenuCommand === 'function') {
    const isZh = resolveLang(settings.uiLang) === 'zh';
    const L = isZh
      ? {
          toggle: '开启 / 暂停美化',
          theme: '切换外观 (跟随 / 浅色 / 深色)',
          width: '切换列宽 (768px / 920px / 1120px / 90%)',
          indent: '切换缩进 (标准GPT / 65% / 0% / 125%)',
          avatar: '显示 / 隐藏 AI 头像',
          clean: '开启 / 关闭纯净模式',
          ctrlEnter: '开启 / 关闭 Ctrl+Enter 发送',
          lang: 'Language: 切换为 English (需刷新菜单)'
        }
      : {
          toggle: 'Enable / Pause Styling',
          theme: 'Cycle Theme (Auto / Light / Dark)',
          width: 'Cycle Width (768px / 920px / 1120px / 90%)',
          indent: 'Cycle Indent (GPT / 65% / 0% / 125%)',
          avatar: 'Show / Hide AI Avatar',
          clean: 'Toggle Clean View',
          ctrlEnter: 'Toggle Ctrl+Enter to Send',
          lang: '语言: 切换为中文 (Reload for menu)'
        };

    GM_registerMenuCommand(L.toggle, () => {
      settings.enabled = !settings.enabled;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand(L.theme, () => {
      const modes = ['auto', 'light', 'dark'];
      settings.themeMode = modes[(modes.indexOf(settings.themeMode) + 1) % modes.length];
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand(L.width, () => {
      const widths = ['800px', '920px', '1120px', '90%'];
      settings.chatWidth = widths[(widths.indexOf(settings.chatWidth) + 1) % widths.length];
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand(L.indent, () => {
      const scales = ['1', '0.65', '0', '1.25'];
      const curIdx = scales.indexOf(String(settings.indentScale));
      settings.indentScale = scales[(curIdx === -1 ? 0 : curIdx + 1) % scales.length];
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand(L.avatar, () => {
      settings.hideAvatar = !settings.hideAvatar;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand(L.clean, () => {
      settings.cleanView = !settings.cleanView;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand(L.ctrlEnter, () => {
      settings.ctrlEnterSend = !settings.ctrlEnterSend;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand(L.lang, () => {
      settings.uiLang = resolveLang(settings.uiLang) === 'zh' ? 'en' : 'zh';
      saveSettings(settings);
      window.location.reload();
    });
  }
})();
`;

const outPath = path.join(outDir, 'refined-gemini.user.js');
fs.writeFileSync(outPath, userScript);
console.log(`Generated ${outPath}`);
