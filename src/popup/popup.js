/**
 * Refined Gemini — Popup Controller
 * Syncs user preferences with chrome.storage.sync and supports instant Chinese/English UI switching.
 */
(function () {
  'use strict';

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

  const I18N = {
    zh: {
      masterTip: '开启 / 暂停美化',
      theme: '外观',
      themeAuto: '跟随',
      themeLight: '浅色',
      themeDark: '深色',
      width: '列宽',
      fontSize: '字号',
      indent: '缩进',
      indentGpt: '标准 GPT',
      hideAvatar: '隐藏 AI 头像',
      compactSidebar: '紧凑侧边栏',
      cleanView: '纯净模式',
      sendSuffix: '发送',
      reset: '恢复默认'
    },
    en: {
      masterTip: 'Enable / Pause styling',
      theme: 'Theme',
      themeAuto: 'Auto',
      themeLight: 'Light',
      themeDark: 'Dark',
      width: 'Width',
      fontSize: 'Font Size',
      indent: 'Indent',
      indentGpt: 'GPT',
      hideAvatar: 'Hide AI Avatar',
      compactSidebar: 'Compact Sidebar',
      cleanView: 'Clean View',
      sendSuffix: 'to Send',
      reset: 'Reset'
    }
  };

  const els = {
    toggleEnabled: document.getElementById('toggleEnabled'),
    masterSwitchLabel: document.getElementById('masterSwitchLabel'),
    langSwitch: document.getElementById('langSwitch'),
    langBtns: document.querySelectorAll('#langSwitch .lang-btn'),
    settingsBody: document.getElementById('settingsBody'),
    toggleHideAvatar: document.getElementById('toggleHideAvatar'),
    toggleCompactSidebar: document.getElementById('toggleCompactSidebar'),
    toggleCleanView: document.getElementById('toggleCleanView'),
    toggleCtrlEnter: document.getElementById('toggleCtrlEnter'),
    modKeyLabel: document.getElementById('modKeyLabel'),
    resetBtn: document.getElementById('resetBtn'),
    segmentedGroups: document.querySelectorAll('.segmented[data-key]'),
    i18nNodes: document.querySelectorAll('[data-i18n]')
  };

  let state = { ...DEFAULTS };

  if (/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)) {
    els.modKeyLabel.textContent = '⌘';
  }

  function resolveLang(uiLang) {
    if (uiLang === 'zh' || uiLang === 'en') return uiLang;
    const nav = String(navigator.language || '').toLowerCase();
    return nav.startsWith('zh') ? 'zh' : 'en';
  }

  function applyLanguage(lang) {
    const dict = I18N[lang] || I18N.en;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    els.masterSwitchLabel.title = dict.masterTip;

    els.i18nNodes.forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (key && Object.prototype.hasOwnProperty.call(dict, key)) {
        node.textContent = dict[key];
      }
    });

    els.langBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function renderUI(settings) {
    state = { ...DEFAULTS, ...settings };
    if (state.chatWidth === '768px') {
      state.chatWidth = '800px';
    }
    state.indentScale = VALID_INDENT_SCALES.has(String(state.indentScale))
      ? String(state.indentScale)
      : '1';
    state.uiLang = VALID_LANGS.has(String(state.uiLang)) ? String(state.uiLang) : 'auto';

    applyLanguage(resolveLang(state.uiLang));

    els.toggleEnabled.checked = Boolean(state.enabled);
    els.settingsBody.classList.toggle('is-disabled', !state.enabled);

    els.toggleHideAvatar.checked = Boolean(state.hideAvatar);
    els.toggleCompactSidebar.checked = Boolean(state.compactSidebar);
    els.toggleCleanView.checked = Boolean(state.cleanView);
    els.toggleCtrlEnter.checked = Boolean(state.ctrlEnterSend);

    els.segmentedGroups.forEach((group) => {
      const key = group.getAttribute('data-key');
      const currentVal = state[key];
      group.querySelectorAll('.seg-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-value') === currentVal);
      });
    });
  }

  function persistPatch(patch) {
    state = { ...state, ...patch };
    renderUI(state);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(patch);
    }
  }

  els.langSwitch.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const nextLang = btn.getAttribute('data-lang');
    if (nextLang && resolveLang(state.uiLang) !== nextLang) {
      persistPatch({ uiLang: nextLang });
    }
  });

  els.toggleEnabled.addEventListener('change', (e) => {
    persistPatch({ enabled: e.target.checked });
  });

  els.toggleHideAvatar.addEventListener('change', (e) => {
    persistPatch({ hideAvatar: e.target.checked });
  });

  els.toggleCompactSidebar.addEventListener('change', (e) => {
    persistPatch({ compactSidebar: e.target.checked });
  });

  els.toggleCleanView.addEventListener('change', (e) => {
    persistPatch({ cleanView: e.target.checked });
  });

  els.toggleCtrlEnter.addEventListener('change', (e) => {
    persistPatch({ ctrlEnterSend: e.target.checked });
  });

  els.segmentedGroups.forEach((group) => {
    const key = group.getAttribute('data-key');
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      const val = btn.getAttribute('data-value');
      if (val && state[key] !== val) {
        persistPatch({ [key]: val });
      }
    });
  });

  els.resetBtn.addEventListener('click', () => {
    persistPatch({ ...DEFAULTS, uiLang: state.uiLang });
  });

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      renderUI({ ...DEFAULTS, ...stored });
    });
  } else {
    renderUI(DEFAULTS);
  }
})();
