/**
 * Refined Gemini — Popup Controller
 *
 * Syncs user preferences with chrome.storage.sync, supports instant Chinese/English UI
 * switching, and surfaces contextual state (paused, not on Gemini, reload needed, layout
 * drift detected) with keyboard-accessible controls.
 *
 * Runs in two hosts:
 *   - Extension popup (document root, real `chrome.*` APIs)
 *   - UserScript in-page panel (Shadow DOM root, GM-backed `chrome` shim). The panel sets
 *     `globalThis.__RG_POPUP_HOST__ = { root, hostEl, page }` before evaluating this file.
 */
(function () {
  'use strict';

  const RG = globalThis.REFINED_GEMINI;
  const DEFAULTS = RG.DEFAULTS;
  const HOST = globalThis.__RG_POPUP_HOST__ || null;
  const ROOT = (HOST && HOST.root) || document;
  const THEME_HOST = (HOST && HOST.hostEl) || document.documentElement;
  const IS_PANEL = Boolean(HOST);
  const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
  const GEMINI_URL = 'https://gemini.google.com/app';

  const I18N = {
    zh: {
      statusOn: '美化已启用',
      statusOff: '已暂停 · 原生界面',
      masterOn: '暂停美化',
      masterOff: '启用美化',
      language: '界面语言',
      theme: '外观',
      themeAuto: '自动',
      themeLight: '浅色',
      themeDark: '深色',
      width: '内容宽度',
      widthStd: '标准',
      widthWide: '宽',
      widthWider: '超宽',
      widthFluid: '自适应',
      fontSize: '字号',
      fontSm: '小',
      fontMd: '标准',
      fontLg: '大',
      indent: '列表缩进',
      indentNone: '无',
      indentCompact: '紧凑',
      indentStd: '标准',
      indentRelaxed: '宽松',
      hideAvatar: '隐藏 AI 头像',
      compactSidebar: '紧凑侧边栏',
      cleanView: '纯净模式',
      scaledHeadings: '标题分级字号',
      defaultHighThinking: '新对话默认高强度',
      sendSuffix: '发送',
      reset: '恢复默认',
      resetDone: '已恢复默认设置',
      undo: '撤销',
      shortcut: (k) => `${k} 快速开关`,
      shortcutUnset: '设置快捷键',
      hints: {
        themeMode: { auto: '跟随 Gemini / 系统的深浅色', light: '始终使用浅色界面', dark: '始终使用深色界面' },
        chatWidth: { '800px': '768px 正文宽度，与 ChatGPT 一致（推荐）', '920px': '920px，适合宽表格与代码', '1120px': '1120px，适合大屏', '90%': '随窗口宽度伸展（窗口的 90%）' },
        fontSize: { '15px': '正文 15px，信息密度更高', '16px': '正文 16px，与 ChatGPT 一致（推荐）', '17px': '正文 17px，阅读更轻松' },
        indentScale: { '0': '列表标记与正文左对齐，无缩进', '0.65': '缩进为标准的 65%', '1': '与 ChatGPT 一致的列表缩进（推荐）', '1.25': '缩进为标准的 125%，层级更明显' },
        hideAvatarHint: '隐藏 Gemini 星形头像，回复与正文左对齐',
        compactSidebarHint: '侧边栏收窄为 260px，会话行更紧凑',
        cleanViewHint: '隐藏底部免责声明、位置信息与推广横幅',
        scaledHeadingsHint: 'H1–H3 递进放大，长回答更易浏览；关闭则与正文同字号',
        defaultHighThinkingHint: '新对话初始化时选择高思考强度；之后可手动调整。高强度消耗更多额度。',
        ctrlEnterHint: '开启后 Enter 换行，Ctrl/⌘ + Enter 发送（不影响输入法选词）',
        langHint: '切换设置面板与页面提示的语言'
      },
      notice: {
        notGemini: '当前页面不是 Gemini，设置会在 Gemini 页面生效。',
        openGemini: '打开 Gemini',
        reload: '此页面在安装或更新扩展前已打开，刷新后才能应用最新样式。',
        reloadBtn: '刷新页面',
        drift: '检测到 Gemini 页面结构有变化，部分样式可能没有生效。',
        report: '反馈'
      }
    },
    en: {
      statusOn: 'Styling on',
      statusOff: 'Paused · native UI',
      masterOn: 'Pause styling',
      masterOff: 'Enable styling',
      language: 'Interface language',
      theme: 'Theme',
      themeAuto: 'Auto',
      themeLight: 'Light',
      themeDark: 'Dark',
      width: 'Content width',
      widthStd: 'Standard',
      widthWide: 'Wide',
      widthWider: 'Wider',
      widthFluid: 'Fluid',
      fontSize: 'Font size',
      fontSm: 'Small',
      fontMd: 'Default',
      fontLg: 'Large',
      indent: 'List indent',
      indentNone: 'None',
      indentCompact: 'Compact',
      indentStd: 'Default',
      indentRelaxed: 'Relaxed',
      hideAvatar: 'Hide AI avatar',
      compactSidebar: 'Compact sidebar',
      cleanView: 'Clean view',
      scaledHeadings: 'Scaled headings',
      defaultHighThinking: 'Start new chats on High',
      sendSuffix: 'to send',
      reset: 'Reset',
      resetDone: 'Settings reset to defaults',
      undo: 'Undo',
      shortcut: (k) => `${k} to toggle`,
      shortcutUnset: 'Set a shortcut',
      hints: {
        themeMode: { auto: 'Follow Gemini / system light & dark mode', light: 'Always use the light theme', dark: 'Always use the dark theme' },
        chatWidth: { '800px': '768px prose column, same as ChatGPT (recommended)', '920px': '920px, roomier for tables & code', '1120px': '1120px, for large displays', '90%': 'Stretch with the window (90% wide)' },
        fontSize: { '15px': '15px body text, denser', '16px': '16px body text, same as ChatGPT (recommended)', '17px': '17px body text, easier reading' },
        indentScale: { '0': 'List markers flush with body text', '0.65': '65% of the default indent', '1': 'ChatGPT list indentation (recommended)', '1.25': '125% indent, clearer nesting' },
        hideAvatarHint: 'Hide the Gemini sparkle avatar and align replies to one left edge',
        compactSidebarHint: 'Narrow the sidebar to 260px with tighter conversation rows',
        cleanViewHint: 'Hide footer disclaimers, location info and upsell banners',
        scaledHeadingsHint: 'Larger H1–H3 for easier scanning; off keeps headings at body size',
        defaultHighThinkingHint: 'Select High when a new chat initializes; manual changes are respected. High uses more quota.',
        ctrlEnterHint: 'Enter inserts a new line; Ctrl/⌘ + Enter sends (IME-safe)',
        langHint: 'Language for this panel and in-page notices'
      },
      notice: {
        notGemini: 'This tab isn’t Gemini. Settings apply on gemini.google.com.',
        openGemini: 'Open Gemini',
        reload: 'This tab was opened before the extension was installed or updated. Reload to apply the latest styles.',
        reloadBtn: 'Reload',
        drift: 'Gemini’s page structure seems to have changed; some styles may not apply.',
        report: 'Report'
      }
    }
  };

  const $ = (id) => ROOT.getElementById(id);
  const els = {
    shell: $('rgPopup'),
    statusLabel: $('statusLabel'),
    toggleEnabled: $('toggleEnabled'),
    masterSwitchLabel: $('masterSwitchLabel'),
    langSwitch: $('langSwitch'),
    langBtns: ROOT.querySelectorAll('#langSwitch .lang-btn'),
    settingsBody: $('settingsBody'),
    switches: ROOT.querySelectorAll('.switches-list input[data-key]'),
    rows: ROOT.querySelectorAll('.row-item[data-hint]'),
    modKeys: ROOT.querySelectorAll('.mod-key'),
    resetBtn: $('resetBtn'),
    segmentedGroups: ROOT.querySelectorAll('.segmented[data-key]'),
    i18nNodes: ROOT.querySelectorAll('[data-i18n]'),
    notice: $('notice'),
    noticeText: $('noticeText'),
    noticeAction: $('noticeAction'),
    footerDefault: $('footerDefault'),
    footerHintText: $('footerHintText'),
    versionLabel: $('versionLabel'),
    shortcutLink: $('shortcutLink'),
    toast: $('toast'),
    toastText: $('toastText'),
    toastAction: $('toastAction')
  };

  let state = { ...DEFAULTS };
  let dict = I18N.en;
  let tabInfo = { kind: 'unknown', health: null, tabId: null };
  let shortcutKey = '';
  let toastTimer = 0;
  let undoSnapshot = null;
  let activeHint = null;

  const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

  // ---------------------------------------------------------------- rendering

  function applyLanguage(lang) {
    dict = I18N[lang] || I18N.en;
    if (!IS_PANEL) document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    if (els.shell) els.shell.lang = lang === 'zh' ? 'zh-CN' : 'en';

    els.i18nNodes.forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (key && typeof dict[key] === 'string') node.textContent = dict[key];
    });
    els.langSwitch.setAttribute('aria-label', dict.language);
    els.langSwitch.title = dict.hints.langHint;
    els.langBtns.forEach((btn) => {
      const on = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = on ? 0 : -1;
    });

    // Tooltips + accessible descriptions on every segmented option
    els.segmentedGroups.forEach((group) => {
      const key = group.getAttribute('data-key');
      group.querySelectorAll('.seg-btn').forEach((btn) => {
        const hint = dict.hints[key] && dict.hints[key][btn.getAttribute('data-value')];
        if (hint) btn.title = hint;
      });
    });
    els.rows.forEach((row) => {
      const hint = dict.hints[row.getAttribute('data-hint')];
      const input = row.querySelector('input');
      if (hint && input) input.setAttribute('aria-description', hint);
    });
  }

  function resolvePopupTheme() {
    if (state.themeMode === 'light' || state.themeMode === 'dark') return state.themeMode;
    if (tabInfo.health && (tabInfo.health.theme === 'light' || tabInfo.health.theme === 'dark')) {
      return tabInfo.health.theme;
    }
    if (IS_PANEL && HOST.page && typeof HOST.page.health === 'function') {
      try {
        return HOST.page.health().theme;
      } catch (_) {}
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function renderUI(settings) {
    state = RG.normalize(settings);
    applyLanguage(RG.resolveLang(state.uiLang));
    THEME_HOST.setAttribute('data-theme', resolvePopupTheme());

    const enabled = Boolean(state.enabled);
    els.toggleEnabled.checked = enabled;
    els.toggleEnabled.setAttribute('aria-label', enabled ? dict.masterOn : dict.masterOff);
    els.masterSwitchLabel.title = enabled ? dict.masterOn : dict.masterOff;
    els.statusLabel.textContent = enabled ? dict.statusOn : dict.statusOff;
    els.shell.classList.toggle('is-paused', !enabled);
    els.settingsBody.classList.toggle('is-disabled', !enabled);

    els.switches.forEach((input) => {
      input.checked = Boolean(state[input.getAttribute('data-key')]);
    });

    els.segmentedGroups.forEach((group) => {
      const key = group.getAttribute('data-key');
      group.querySelectorAll('.seg-btn').forEach((btn) => {
        const on = btn.getAttribute('data-value') === state[key];
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', String(on));
        btn.tabIndex = on ? 0 : -1;
      });
    });

    renderNotice();
    renderFooter();
  }

  function renderFooter() {
    const showHint = Boolean(activeHint);
    els.footerHintText.hidden = !showHint;
    els.footerDefault.hidden = showHint;
    if (showHint) els.footerHintText.textContent = activeHint;

    if (IS_PANEL) {
      els.shortcutLink.hidden = false;
      els.shortcutLink.disabled = true;
      els.shortcutLink.textContent = dict.shortcut(formatShortcut(RG.TOGGLE_SHORTCUT));
    } else if (hasChrome && chrome.commands) {
      els.shortcutLink.hidden = false;
      els.shortcutLink.textContent = shortcutKey ? dict.shortcut(formatShortcut(shortcutKey)) : dict.shortcutUnset;
    }
  }

  function formatShortcut(key) {
    if (!IS_MAC) return key;
    return key.replace(/Alt\+?/g, '⌥').replace(/Shift\+?/g, '⇧').replace(/Ctrl\+?|Command\+?/g, '⌘').replace(/MacCtrl\+?/g, '⌃');
  }

  function renderNotice() {
    let text = '';
    let action = '';
    let tone = 'warn';
    if (tabInfo.kind === 'other') {
      text = dict.notice.notGemini;
      action = dict.notice.openGemini;
      tone = 'info';
    } else if (tabInfo.kind === 'stale') {
      text = dict.notice.reload;
      action = dict.notice.reloadBtn;
    } else if (tabInfo.kind === 'gemini' && tabInfo.health && state.enabled && !tabInfo.health.ok) {
      text = dict.notice.drift;
      action = dict.notice.report;
    }
    els.notice.hidden = !text;
    els.notice.setAttribute('data-tone', tone);
    els.noticeText.textContent = text;
    els.noticeAction.textContent = action;
    els.noticeAction.hidden = !action;
  }

  // ---------------------------------------------------------------- persistence

  function persistPatch(patch) {
    renderUI({ ...state, ...patch });
    if (hasChrome) chrome.storage.sync.set(patch);
  }

  function showToast(text, actionLabel, onAction) {
    els.toastText.textContent = text;
    els.toastAction.textContent = actionLabel || '';
    els.toastAction.hidden = !actionLabel;
    els.toastAction.onclick = onAction || null;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
  }

  function hideToast() {
    els.toast.hidden = true;
    undoSnapshot = null;
  }

  // ---------------------------------------------------------------- events

  els.langSwitch.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const nextLang = btn.getAttribute('data-lang');
    if (nextLang && RG.resolveLang(state.uiLang) !== nextLang) persistPatch({ uiLang: nextLang });
  });

  els.toggleEnabled.addEventListener('change', (e) => persistPatch({ enabled: e.target.checked }));

  els.switches.forEach((input) => {
    input.addEventListener('change', () => persistPatch({ [input.getAttribute('data-key')]: input.checked }));
  });

  els.segmentedGroups.forEach((group) => {
    const key = group.getAttribute('data-key');
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      const val = btn.getAttribute('data-value');
      if (val && state[key] !== val) persistPatch({ [key]: val });
    });
  });

  // Roving-tabindex arrow-key navigation for every radiogroup (WAI-ARIA radio pattern)
  ROOT.querySelectorAll('[role="radiogroup"]').forEach((group) => {
    group.addEventListener('keydown', (e) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!keys.includes(e.key)) return;
      const items = [...group.querySelectorAll('[role="radio"]')];
      const cur = items.indexOf(e.target.closest('[role="radio"]'));
      if (cur < 0) return;
      e.preventDefault();
      let next = cur;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (cur - 1 + items.length) % items.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (cur + 1) % items.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = items.length - 1;
      items[next].click();
      const refreshed = [...group.querySelectorAll('[role="radio"]')];
      if (refreshed[next]) refreshed[next].focus();
    });
  });

  // Contextual footer hints on hover / keyboard focus (zero permanent clutter)
  function hintFor(target) {
    const seg = target.closest && target.closest('.seg-btn');
    if (seg) {
      const key = seg.closest('.segmented').getAttribute('data-key');
      return (dict.hints[key] && dict.hints[key][seg.getAttribute('data-value')]) || null;
    }
    const row = target.closest && target.closest('.row-item[data-hint]');
    if (row) return dict.hints[row.getAttribute('data-hint')] || null;
    if (target.closest && target.closest('#langSwitch')) return dict.hints.langHint;
    return null;
  }

  function setHint(text) {
    if (text === activeHint) return;
    activeHint = text;
    renderFooter();
  }

  els.shell.addEventListener('pointerover', (e) => setHint(hintFor(e.target)));
  els.shell.addEventListener('pointerleave', () => setHint(null));
  els.shell.addEventListener('focusin', (e) => setHint(hintFor(e.target)));
  els.shell.addEventListener('focusout', (e) => {
    if (!els.shell.contains(e.relatedTarget)) setHint(null);
  });

  els.resetBtn.addEventListener('click', () => {
    undoSnapshot = { ...state };
    persistPatch({ ...DEFAULTS, uiLang: state.uiLang });
    showToast(dict.resetDone, dict.undo, () => {
      if (undoSnapshot) persistPatch(undoSnapshot);
      hideToast();
    });
  });

  els.noticeAction.addEventListener('click', () => {
    if (IS_PANEL && tabInfo.kind === 'gemini') {
      window.open(buildIssueUrl(), '_blank', 'noopener,noreferrer');
      return;
    }
    if (!hasChrome || !chrome.tabs) return;
    if (tabInfo.kind === 'other') {
      chrome.tabs.create({ url: GEMINI_URL });
      window.close();
    } else if (tabInfo.kind === 'stale' && tabInfo.tabId != null) {
      chrome.tabs.reload(tabInfo.tabId);
      window.close();
    } else if (tabInfo.kind === 'gemini') {
      chrome.tabs.create({ url: buildIssueUrl() });
    }
  });

  els.shortcutLink.addEventListener('click', () => {
    if (IS_PANEL || !hasChrome || !chrome.tabs) return;
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  function buildIssueUrl() {
    const h = tabInfo.health || {};
    const title = `[Layout drift] ${(h.issues || []).join(', ')}`;
    const body = [
      '### Environment',
      `- Refined Gemini: v${getVersion()}`,
      `- Theme: ${h.theme || ''}`,
      '',
      '### Failed checks',
      ...(h.issues || []).map((i) => `- \`${i}\``),
      '',
      '### What looks wrong?',
      '<!-- Screenshots are very welcome -->'
    ].join('\n');
    return `${RG.ISSUES_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  function getVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch (_) {
      return RG.VERSION || '';
    }
  }

  // ---------------------------------------------------------------- environment probes

  function probeActiveTab() {
    if (IS_PANEL) {
      tabInfo = { kind: 'gemini', health: HOST.page && HOST.page.health ? HOST.page.health() : null, tabId: null };
      renderUI(state);
      return;
    }
    if (!hasChrome || !chrome.tabs || !chrome.tabs.query) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab) return;
      const url = tab.url || '';
      if (!url.startsWith('https://gemini.google.com/')) {
        tabInfo = { kind: url ? 'other' : 'unknown', health: null, tabId: tab.id };
        renderUI(state);
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: 'RG_HEALTH' }, (res) => {
        const failed = chrome.runtime.lastError || !res;
        tabInfo = failed
          ? { kind: 'stale', health: null, tabId: tab.id }
          : { kind: 'gemini', health: res, tabId: tab.id };
        renderUI(state);
      });
    });
  }

  function loadShortcut() {
    if (IS_PANEL || !hasChrome || !chrome.commands || !chrome.commands.getAll) return;
    chrome.commands.getAll((commands) => {
      const cmd = (commands || []).find((c) => c.name === 'toggle-styling');
      shortcutKey = (cmd && cmd.shortcut) || '';
      renderFooter();
    });
  }

  // ---------------------------------------------------------------- boot

  els.versionLabel.textContent = `v${getVersion()}`;
  els.modKeys.forEach((k) => {
    k.textContent = IS_MAC ? '⌘' : 'Ctrl';
  });

  if (hasChrome) {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      renderUI(stored);
      probeActiveTab();
    });
    // Keep in sync with changes made elsewhere (keyboard shortcut, other windows)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      const patch = {};
      for (const key of Object.keys(changes)) {
        if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) patch[key] = changes[key].newValue;
      }
      if (Object.keys(patch).length) renderUI({ ...state, ...patch });
    });
  } else {
    renderUI(DEFAULTS);
  }
  loadShortcut();

  if (window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (mql.addEventListener) mql.addEventListener('change', () => renderUI(state));
  }

  // Expose a refresh hook for the UserScript panel (re-render on open)
  if (IS_PANEL) HOST.refresh = () => probeActiveTab();
})();
