#!/usr/bin/env node
/**
 * Builds userscript/refined-gemini.user.js directly from src/content.css,
 * ensuring Tampermonkey / Violentmonkey users get the exact same 1:1 ChatGPT styles.
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
// @version      1.0.1
// @description  1:1 对齐 ChatGPT 网页端视觉与排版基准：纯白/深灰画布、现代中英混排字体栈、无竖框左对齐表格、柔和圆角代码卡片与极简降噪布局。
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
    chatWidth: '768px',     // '768px' | '920px' | '1120px' | '90%'
    fontSize: '16px',       // '15px' | '16px' | '17px'
    hideAvatar: true,
    compactSidebar: true,
    cleanView: true,
    ctrlEnterSend: false
  };

  const CSS = ${JSON.stringify(cssContent)};

  function readSettings() {
    try {
      if (typeof GM_getValue === 'function') {
        const saved = GM_getValue(STORAGE_KEY, null);
        if (saved && typeof saved === 'object') return { ...DEFAULTS, ...saved };
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
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
      return;
    }
    const theme = settings.themeMode === 'auto' ? (detectNativeDark() ? 'dark' : 'light') : settings.themeMode;
    root.setAttribute('data-rg-enabled', 'true');
    root.setAttribute('data-rg-theme', theme);
    root.setAttribute('data-rg-hide-avatar', String(Boolean(settings.hideAvatar)));
    root.setAttribute('data-rg-compact-sidebar', String(Boolean(settings.compactSidebar)));
    root.setAttribute('data-rg-clean-view', String(Boolean(settings.cleanView)));
    root.style.setProperty('--rg-chat-max-width', settings.chatWidth);
    root.style.setProperty('--rg-font-size', settings.fontSize);
  }

  apply();
  const obs = new MutationObserver(() => {
    injectStyle();
    if (settings.enabled && settings.themeMode === 'auto') apply();
  });
  obs.observe(document.documentElement, { attributes: true, childList: true, attributeFilter: ['class', 'data-theme'] });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    }
  });

  // Register quick menu commands in Tampermonkey
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('切换总开关 (开启 / 暂停美化)', () => {
      settings.enabled = !settings.enabled;
      saveSettings(settings);
      apply();
    });
    GM_registerMenuCommand('切换对话列宽 (768px / 920px / 1120px / 90%)', () => {
      const widths = ['768px', '920px', '1120px', '90%'];
      settings.chatWidth = widths[(widths.indexOf(settings.chatWidth) + 1) % widths.length];
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
  }
})();
`;

const outPath = path.join(outDir, 'refined-gemini.user.js');
fs.writeFileSync(outPath, userScript);
console.log(`Generated ${outPath}`);
