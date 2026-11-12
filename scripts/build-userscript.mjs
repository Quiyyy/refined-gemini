#!/usr/bin/env node
/**
 * Builds userscript/refined-gemini.user.js directly from src/content.css,
 * ensuring Tampermonkey / Violentmonkey users get 100% visual & interactive parity
 * with the Manifest V3 browser extension.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const cssContent = fs.readFileSync(path.join(ROOT, 'src/content.css'), 'utf8');
const outDir = path.join(ROOT, 'userscript');
fs.mkdirSync(outDir, { recursive: true });

const userScript = `// ==UserScript==
// @name         Refined Gemini (1:1 ChatGPT Web UI Alignment)
// @namespace    https://github.com/Quiyyy/refined-gemini
// @version      1.3.0
// @description  1:1 对齐 ChatGPT 网页端视觉与排版基准：纯白/深灰画布、浅蓝用户气泡与 #0285FF 强调色、可配置缩进比例（默认对齐 GPT）、紧凑代码块与无竖框表格。
// @author       Quiyyy
// @license      MIT
// @match        https://gemini.google.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'refined_gemini_settings_v1';
  const DEFAULTS = {
    enabled: true,
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
  const CSS = ${JSON.stringify(cssContent)};

  function normalize(obj) {
    const merged = { ...DEFAULTS, ...(obj || {}) };
    if (merged.chatWidth === '768px') merged.chatWidth = '800px';
    if (!VALID_INDENT_SCALES.has(String(merged.indentScale))) {
      merged.indentScale = '1';
    } else {
      merged.indentScale = String(merged.indentScale);
    }
    return merged;
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
      return;
    }
    const theme = settings.themeMode === 'auto' ? (detectNativeDark() ? 'dark' : 'light') : settings.themeMode;
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
  }

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
    GM_registerMenuCommand('切换总开关 (开启 / 暂停美化)', () => {
      settings.enabled = !settings.enabled;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand('切换对话列宽 (标准768 / 920px / 1120px / 90%)', () => {
      const widths = ['800px', '920px', '1120px', '90%'];
      settings.chatWidth = widths[(widths.indexOf(settings.chatWidth) + 1) % widths.length];
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand('切换缩进比例 (标准GPT / 紧凑65% / 无0% / 宽松125%)', () => {
      const scales = ['1', '0.65', '0', '1.25'];
      const curIdx = scales.indexOf(String(settings.indentScale));
      settings.indentScale = scales[(curIdx === -1 ? 0 : curIdx + 1) % scales.length];
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand('切换外观配色 (跟随 / 浅色 / 深色)', () => {
      const modes = ['auto', 'light', 'dark'];
      settings.themeMode = modes[(modes.indexOf(settings.themeMode) + 1) % modes.length];
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand('开启/关闭 AI 头像隐藏', () => {
      settings.hideAvatar = !settings.hideAvatar;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand('开启/关闭纯净降噪模式', () => {
      settings.cleanView = !settings.cleanView;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand('开启/关闭 Ctrl/⌘ + Enter 发送', () => {
      settings.ctrlEnterSend = !settings.ctrlEnterSend;
      saveSettings(settings);
      apply();
    });
  }
})();
`;

const outPath = path.join(outDir, 'refined-gemini.user.js');
fs.writeFileSync(outPath, userScript);
console.log(`Generated ${outPath}`);
