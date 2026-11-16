#!/usr/bin/env node
/**
 * Builds userscript/refined-gemini.user.js by bundling the *exact* extension runtime
 * sources (src/defaults.js, src/content.js, src/sandbox.js, src/popup/*) behind a tiny
 * GM_* backed `chrome` shim. The UserScript therefore has 100% behavioral parity with
 * the Manifest V3 extension — including the full settings panel (rendered in a
 * Shadow DOM), the Alt+Shift+G quick toggle, Ctrl/⌘+Enter, layout health checks and
 * Generative UI sandbox harmonization — with zero duplicated logic to drift.
 *
 * Gemini enforces Trusted Types, so the popup markup is pre-compiled here into a JSON
 * element tree and materialized with createElement() at runtime (no innerHTML).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const pkg = JSON.parse(read('package.json'));
const sources = {
  defaults: read('src/defaults.js'),
  content: read('src/content.js'),
  modelPicker: read('src/model-picker.js'),
  sandbox: read('src/sandbox.js'),
  contentCss: read('src/content.css'),
  sandboxCss: read('src/sandbox.css'),
  popupHtml: read('src/popup/popup.html'),
  popupCss: read('src/popup/popup.css'),
  popupJs: read('src/popup/popup.js')
};

// ---------------------------------------------------------------------------
// Minimal, dependency-free HTML -> JSON tree compiler for the (well-formed) popup.
// ---------------------------------------------------------------------------
const VOID_TAGS = new Set(['input', 'br', 'img', 'meta', 'link', 'hr']);

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseHtml(src) {
  const root = { t: '#root', c: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].t === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    if (m[2]) {
      const tag = m[2].toLowerCase();
      const attrs = {};
      const attrRe = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let a;
      while ((a = attrRe.exec(m[3] || ''))) {
        attrs[a[1]] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? '');
      }
      const node = { t: tag, a: attrs, c: [] };
      top.c.push(node);
      if (!m[4] && !VOID_TAGS.has(tag)) stack.push(node);
      continue;
    }
    if (m[5] !== undefined) {
      const text = decodeEntities(m[5]);
      if (/^\s+$/.test(text)) {
        top.c.push(' ');
      } else {
        top.c.push(text.replace(/\s+/g, ' '));
      }
    }
  }
  return root;
}

function findById(node, id) {
  if (!node || typeof node === 'string') return null;
  if (node.a && node.a.id === id) return node;
  for (const child of node.c || []) {
    const hit = findById(child, id);
    if (hit) return hit;
  }
  return null;
}

const popupTree = findById(parseHtml(sources.popupHtml), 'rgPopup');
if (!popupTree) throw new Error('popup.html: #rgPopup root not found');

// Popup stylesheet adapted for the Shadow DOM panel host
const PANEL_CSS = `${sources.popupCss}
:host {
  all: initial;
  position: fixed;
  top: 64px;
  right: 16px;
  z-index: 2147483001;
  display: block;
}
:host([hidden]) { display: none; }
.popup-shell {
  width: 320px;
  max-height: calc(100vh - 88px);
  overflow-y: auto;
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: rg-panel-in 0.16s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes rg-panel-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
`;

const banner = `// ==UserScript==
// @name               Refined Gemini — 1:1 ChatGPT Web UI Alignment
// @name:zh-CN         Refined Gemini — 1:1 对齐 ChatGPT 网页端界面
// @name:zh-TW         Refined Gemini — 1:1 對齊 ChatGPT 網頁端介面
// @namespace          https://github.com/Quiyyy/refined-gemini
// @version            ${pkg.version}
// @description        Align Google Gemini Web UI 1:1 with ChatGPT: uniform typography, clean white/dark surfaces, soft-blue bubbles, #0285FF accents, unified widgets & diagrams, in-page settings panel and Alt+Shift+G quick toggle.
// @description:zh-CN  1:1 对齐 ChatGPT 网页端视觉与排版：统一字号、纯白/深灰画布、浅蓝气泡与 #0285FF 强调色、80+ 组件与图表同源管理，附页内设置面板与 Alt+Shift+G 快速开关。
// @description:zh-TW  1:1 對齊 ChatGPT 網頁端視覺與排版：統一字級、純白/深灰畫布、淺藍氣泡與 #0285FF 強調色、80+ 組件與圖表同源管理，附頁內設定面板與 Alt+Shift+G 快速開關。
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
// @grant              GM_unregisterMenuCommand
// @grant              GM_addValueChangeListener
// ==/UserScript==
//
// AUTO-GENERATED by scripts/build-userscript.mjs from src/* — do not edit by hand.
`;

const userScript = `${banner}
(function () {
  'use strict';

  const RG_VERSION = ${JSON.stringify(pkg.version)};

  // ---------------------------------------------------------------- src/defaults.js
${sources.defaults}

  const RG = globalThis.REFINED_GEMINI;
  const STORAGE_KEY = RG.STORAGE_KEY;
  const IS_TOP = window === window.top;
  const HOST = String(location.hostname || '').toLowerCase();

  // ---------------------------------------------------------------- GM-backed chrome shim
  function createChromeShim() {
    const listeners = new Set();
    const readStore = () => {
      try {
        const v = typeof GM_getValue === 'function' ? GM_getValue(STORAGE_KEY, null) : null;
        if (v && typeof v === 'object') return { ...v };
        if (typeof v === 'string') return JSON.parse(v) || {};
      } catch (_) {}
      return {};
    };
    const diff = (prev, next) => {
      const changes = {};
      for (const key of Object.keys(RG.DEFAULTS)) {
        if (prev[key] !== next[key]) changes[key] = { oldValue: prev[key], newValue: next[key] };
      }
      return changes;
    };
    const emit = (changes) => {
      if (!Object.keys(changes).length) return;
      listeners.forEach((fn) => {
        try {
          fn(changes, 'sync');
        } catch (_) {}
      });
    };
    if (typeof GM_addValueChangeListener === 'function') {
      // Cross-tab sync: another Gemini tab changed settings
      GM_addValueChangeListener(STORAGE_KEY, (_name, oldVal, newVal, remote) => {
        if (remote) emit(diff(oldVal || {}, newVal || {}));
      });
    }
    return {
      storage: {
        sync: {
          get(defaults, cb) {
            const data = { ...(defaults || {}), ...readStore() };
            setTimeout(() => cb && cb(data), 0);
          },
          set(patch, cb) {
            const prev = readStore();
            const next = { ...prev, ...(patch || {}) };
            try {
              if (typeof GM_setValue === 'function') GM_setValue(STORAGE_KEY, next);
            } catch (_) {}
            emit(diff(prev, next));
            if (cb) setTimeout(cb, 0);
          },
          clear(cb) {
            const prev = readStore();
            try {
              if (typeof GM_setValue === 'function') GM_setValue(STORAGE_KEY, {});
            } catch (_) {}
            emit(diff(prev, {}));
            if (cb) setTimeout(cb, 0);
          }
        },
        onChanged: {
          addListener(fn) {
            listeners.add(fn);
          }
        }
      },
      runtime: {
        lastError: undefined,
        getManifest: () => ({ version: RG_VERSION }),
        onMessage: { addListener() {} }
      }
    };
  }

  const chromeShim = createChromeShim();

  function injectStyle(id, css) {
    const attach = () => {
      if (document.getElementById(id)) return true;
      const parent = document.head || document.documentElement;
      if (!parent) return false;
      const style = document.createElement('style');
      style.id = id;
      style.setAttribute('data-rg-own-style', '');
      style.textContent = css;
      parent.appendChild(style);
      return true;
    };
    if (!attach()) {
      const mo = new MutationObserver(() => {
        if (attach()) mo.disconnect();
      });
      mo.observe(document, { childList: true, subtree: true });
    }
  }

  // Some managers run document-start scripts before <html> exists; defer until it does.
  function whenRoot(run) {
    if (document.documentElement) return run();
    const mo = new MutationObserver(() => {
      if (!document.documentElement) return;
      mo.disconnect();
      run();
    });
    mo.observe(document, { childList: true });
  }

  // ---------------------------------------------------------------- Generative UI sandbox subframes
  if (!IS_TOP) {
    if (HOST.startsWith('feedback') || HOST.includes('accounts.google') || HOST.includes('uservoice')) return;
    injectStyle('refined-gemini-sandbox-style', ${JSON.stringify(sources.sandboxCss)});
    whenRoot(() => (function (chrome) {
      // ------------------------------------------------------------ src/sandbox.js
${sources.sandbox}
    })(chromeShim));
    return;
  }

  if (HOST !== 'gemini.google.com') return;

  // ---------------------------------------------------------------- Main Gemini page
  injectStyle('refined-gemini-style', ${JSON.stringify(sources.contentCss)});

  whenRoot(() => (function (chrome) {
    // -------------------------------------------------------------- src/content.js
${sources.content}
${sources.modelPicker}
  })(chromeShim));

  // ---------------------------------------------------------------- In-page settings panel
  const POPUP_TREE = ${JSON.stringify(popupTree)};
  const PANEL_CSS = ${JSON.stringify(PANEL_CSS)};
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function build(node, inSvg) {
    if (typeof node === 'string') return document.createTextNode(node);
    const svg = inSvg || node.t === 'svg';
    const el = svg ? document.createElementNS(SVG_NS, node.t) : document.createElement(node.t);
    for (const [k, v] of Object.entries(node.a || {})) el.setAttribute(k, v);
    for (const child of node.c || []) el.appendChild(build(child, svg));
    return el;
  }

  function runPopup(chrome) {
    // ------------------------------------------------------------ src/popup/popup.js
${sources.popupJs}
  }

  let panelHost = null;
  let popupHost = null;

  function onOutsidePointer(e) {
    if (panelHost && !panelHost.hidden && !e.composedPath().includes(panelHost)) closePanel();
  }

  function onPanelKey(e) {
    if (e.key === 'Escape' && panelHost && !panelHost.hidden) {
      e.stopPropagation();
      closePanel();
    }
  }

  function openPanel() {
    if (!document.body) return;
    if (!panelHost) {
      panelHost = document.createElement('div');
      panelHost.id = 'refined-gemini-panel';
      const shadow = panelHost.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = PANEL_CSS;
      shadow.appendChild(style);
      const shell = build(POPUP_TREE, false);
      shell.setAttribute('role', 'dialog');
      shell.setAttribute('aria-label', 'Refined Gemini');
      shadow.appendChild(shell);
      document.body.appendChild(panelHost);
      popupHost = { root: shadow, hostEl: panelHost, page: globalThis.__RG_PAGE__ };
      globalThis.__RG_POPUP_HOST__ = popupHost;
      runPopup(chromeShim);
    }
    panelHost.hidden = false;
    if (popupHost && typeof popupHost.refresh === 'function') popupHost.refresh();
    setTimeout(() => {
      document.addEventListener('pointerdown', onOutsidePointer, true);
      document.addEventListener('keydown', onPanelKey, true);
      const first = panelHost.shadowRoot.getElementById('toggleEnabled');
      if (first) first.focus({ preventScroll: true });
    }, 0);
  }

  function closePanel() {
    if (!panelHost) return;
    panelHost.hidden = true;
    document.removeEventListener('pointerdown', onOutsidePointer, true);
    document.removeEventListener('keydown', onPanelKey, true);
  }

  function togglePanel() {
    if (panelHost && !panelHost.hidden) closePanel();
    else openPanel();
  }

  // ---------------------------------------------------------------- Userscript manager menu
  const MENU_TEXT = {
    zh: { panel: '⚙️ 打开设置面板', toggle: '⏯ 开启 / 暂停美化（Alt+Shift+G）' },
    en: { panel: '⚙️ Open settings panel', toggle: '⏯ Enable / pause styling (Alt+Shift+G)' }
  };
  let menuIds = [];
  let menuLang = null;

  function registerMenu(lang) {
    if (typeof GM_registerMenuCommand !== 'function' || lang === menuLang) return;
    if (typeof GM_unregisterMenuCommand === 'function') {
      menuIds.forEach((id) => {
        try {
          GM_unregisterMenuCommand(id);
        } catch (_) {}
      });
    } else if (menuLang) {
      return; // Cannot relabel without unregister support; keep existing entries
    }
    const t = MENU_TEXT[lang] || MENU_TEXT.en;
    menuIds = [
      GM_registerMenuCommand(t.panel, () => {
        if (document.body) openPanel();
        else document.addEventListener('DOMContentLoaded', openPanel, { once: true });
      }),
      GM_registerMenuCommand(t.toggle, () => globalThis.__RG_PAGE__ && globalThis.__RG_PAGE__.toggle())
    ];
    menuLang = lang;
  }

  chromeShim.storage.sync.get(RG.DEFAULTS, (stored) => registerMenu(RG.resolveLang(RG.normalize(stored).uiLang)));
  chromeShim.storage.onChanged.addListener((changes) => {
    if (changes.uiLang) registerMenu(RG.resolveLang(changes.uiLang.newValue));
  });

  globalThis.__RG_PANEL__ = { open: openPanel, close: closePanel, toggle: togglePanel };
})();
`;

const outDir = path.join(ROOT, 'userscript');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'refined-gemini.user.js');
fs.writeFileSync(outPath, userScript);
console.log(`Generated ${path.relative(ROOT, outPath)} (${(userScript.length / 1024).toFixed(1)} KB)`);
