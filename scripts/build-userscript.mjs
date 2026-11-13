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
// @description        Align Google Gemini Web UI 1:1 with ChatGPT: uniform typography, clean white/dark surfaces, soft-blue user bubbles, #0285FF accents, ChatGPT follow-up cards & Generative UI diagram alignment.
// @description:zh-CN  1:1 对齐 ChatGPT 网页端视觉与排版：全局统一字号、纯白/深灰画布、浅蓝用户气泡与 #0285FF 强调色、轻量细框追问建议卡片与交互式流程图同源对齐。
// @description:zh-TW  1:1 對齊 ChatGPT 網頁端視覺與排版：全域統一字級、純白/深灰畫布、淺藍用戶氣泡與 #0285FF 強調色、輕量細框追問建議卡片與互動式流程圖同源對齊。
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
  const isMainHost = host === 'gemini.google.com';

  // --- Generative UI Sandbox Subframe Branch (*.scf.usercontent.goog / *.googleusercontent.com) ---
  if (!isMainHost) {
    if (window === window.top) return;
    if (host.startsWith('feedback') || host.includes('accounts.google') || host.includes('uservoice')) return;

    const isScf = host.endsWith('.scf.usercontent.goog') || host === 'scf.usercontent.goog';
    let sbState = {
      enabled: Boolean(settings.enabled),
      themeMode: settings.themeMode || 'auto',
      parentTheme: null,
      fontSize: settings.fontSize || '16px'
    };

    const LIGHT_MAP = {
      '#3186ff': '#0285ff', '#1a73e8': '#0285ff', '#4285f4': '#0285ff',
      '#0b57d0': '#0169cc', '#0e57d0': '#0169cc', '#1967d2': '#0169cc',
      '#041e49': '#0d0d0d', '#001d35': '#0d0d0d',
      '#dcf1ff': '#e5f3ff', '#d3e3fd': '#e5f3ff', '#e8f0fe': '#e5f3ff',
      '#f2f0f0': '#f7f7f8', '#f4f3f2': '#f7f7f8', '#faf9f9': '#f9f9f9', '#f0f4f9': '#f7f7f8', '#f8f9fa': '#f7f7f8',
      '#e8eef6': '#f4f4f4', '#dde3e9': '#ececec', '#f1f3f4': '#f4f4f4',
      '#1f1f1f': '#0d0d0d', '#444746': '#5d5d5d', '#5f6368': '#5d5d5d', '#747775': '#8f8f8f'
    };
    const DARK_MAP = {
      '#3186ff': '#0285ff', '#1a73e8': '#0285ff', '#4285f4': '#0285ff',
      '#0b57d0': '#66b5ff', '#0e57d0': '#66b5ff', '#1967d2': '#66b5ff', '#a8c7fa': '#66b5ff',
      '#dcf1ff': '#1a3550', '#d3e3fd': '#1a3550', '#e8f0fe': '#1a3550', '#0842a0': '#1a3550',
      '#f2f0f0': '#2a2a2a', '#f4f3f2': '#2a2a2a', '#faf9f9': '#262626', '#f0f4f9': '#2a2a2a',
      '#f8f9fa': '#262626', '#f1f3f4': '#2f2f2f', '#e8eef6': '#2f2f2f', '#dadce0': '#3c3c3c',
      '#282a2c': '#2a2a2a', '#1b1b1b': '#212121', '#041e49': '#ececec', '#1f1f1f': '#ececec',
      '#202124': '#ececec', '#e3e3e3': '#ececec', '#444746': '#b4b4b4', '#5f6368': '#b4b4b4', '#c4c7c5': '#b4b4b4'
    };

    function injectSandboxStyle() {
      if (document.getElementById('refined-gemini-sandbox-style')) return;
      const st = document.createElement('style');
      st.id = 'refined-gemini-sandbox-style';
      st.setAttribute('data-rg-own-style', 'true');
      st.textContent = SANDBOX_CSS;
      (document.head || document.documentElement).appendChild(st);
    }

    function applySandbox() {
      const root = document.documentElement;
      if (!root) return;
      const isGenUi = isScf || Boolean(document.getElementById('app-root') || document.querySelector('.bot-response, script[data-sandbox-runtime]'));
      if (!sbState.enabled || !isGenUi) {
        root.removeAttribute('data-rg-sandbox');
        root.removeAttribute('data-rg-theme');
        return;
      }
      injectSandboxStyle();
      const theme = (sbState.themeMode === 'light' || sbState.themeMode === 'dark')
        ? sbState.themeMode
        : (sbState.parentTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
      root.setAttribute('data-rg-sandbox', 'true');
      root.setAttribute('data-rg-theme', theme);
      root.style.setProperty('--rg-font-size', sbState.fontSize || '16px');
      const map = theme === 'dark' ? DARK_MAP : LIGHT_MAP;
      for (const s of document.querySelectorAll('style:not([data-rg-own-style])')) {
        const cur = s.textContent || '';
        if (s.__rgOrig === undefined || (s.__rgOut !== undefined && s.__rgOut !== cur)) s.__rgOrig = cur;
        let next = s.__rgOrig
          .replace(/#[0-9a-fA-F]{6}\\b/g, (h) => map[h.toLowerCase()] || h)
          .replace(/font-size\\s*:\\s*(?:1[789]|2[0-4])(?:\\.\\d+)?px\\b/gi, 'font-size: var(--rg-font-size, 16px)');
        if (theme === 'dark') {
          next = next.replace(/(background(?:-color)?\\s*:\\s*)#(?:ffffff|fff)\\b/gi, '$1#212121');
        }
        if (cur !== next) s.textContent = next;
        s.__rgOut = next;
      }
      for (const el of document.querySelectorAll('svg [fill], svg [stroke]')) {
        for (const attr of ['fill', 'stroke']) {
          if (!el.hasAttribute(attr)) continue;
          const bAttr = 'data-rg-orig-' + attr;
          const val = (el.getAttribute(attr) || '').trim();
          const orig = el.hasAttribute(bAttr) ? (el.getAttribute(bAttr) || val) : val;
          const mapped = (theme === 'dark' && attr === 'fill' && /^#(?:ffffff|fff)$/i.test(orig))
            ? '#212121'
            : map[orig.toLowerCase()];
          if (mapped && val.toLowerCase() !== mapped) {
            if (!el.hasAttribute(bAttr)) el.setAttribute(bAttr, val);
            el.setAttribute(attr, mapped);
          }
        }
      }
    }

    window.addEventListener('message', (e) => {
      const d = e && e.data;
      if (!d || d.type !== 'RG_SANDBOX_SYNC') return;
      if (typeof d.enabled === 'boolean') sbState.enabled = d.enabled;
      if (d.theme === 'light' || d.theme === 'dark') sbState.parentTheme = d.theme;
      if (typeof d.themeMode === 'string') sbState.themeMode = d.themeMode;
      if (typeof d.fontSize === 'string') sbState.fontSize = d.fontSize;
      applySandbox();
    });

    if (document.documentElement) applySandbox();
    document.addEventListener('DOMContentLoaded', () => {
      applySandbox();
      try { window.parent.postMessage({ type: 'RG_SANDBOX_READY' }, '*'); } catch (_) {}
    });
    return;
  }

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

  function broadcastSandbox() {
    const payload = {
      type: 'RG_SANDBOX_SYNC',
      enabled: Boolean(settings.enabled),
      theme: resolveTheme(),
      themeMode: settings.themeMode || 'auto',
      fontSize: settings.fontSize || '16px'
    };
    const frames = new Set(document.querySelectorAll('iframe'));
    for (const scf of document.querySelectorAll('safe-content-frame')) {
      if (scf.shadowRoot) {
        for (const f of scf.shadowRoot.querySelectorAll('iframe')) frames.add(f);
      }
    }
    for (const f of frames) {
      try { f.contentWindow && f.contentWindow.postMessage(payload, '*'); } catch (_) {}
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
