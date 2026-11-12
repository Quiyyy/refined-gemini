/**
 * Refined Gemini — Popup Controller
 * Syncs user preferences with chrome.storage.sync for instant live updates on gemini.google.com.
 */
(function () {
  'use strict';

  const DEFAULTS = globalThis.REFINED_GEMINI_DEFAULTS || {
    enabled: true,
    themeMode: 'auto',
    chatWidth: '800px',
    fontSize: '16px',
    hideAvatar: true,
    compactSidebar: true,
    cleanView: true,
    ctrlEnterSend: false
  };

  const els = {
    toggleEnabled: document.getElementById('toggleEnabled'),
    statusLabel: document.getElementById('statusLabel'),
    settingsBody: document.getElementById('settingsBody'),
    toggleHideAvatar: document.getElementById('toggleHideAvatar'),
    toggleCompactSidebar: document.getElementById('toggleCompactSidebar'),
    toggleCleanView: document.getElementById('toggleCleanView'),
    toggleCtrlEnter: document.getElementById('toggleCtrlEnter'),
    modKeyLabel: document.getElementById('modKeyLabel'),
    resetBtn: document.getElementById('resetBtn'),
    segmentedGroups: document.querySelectorAll('.segmented[data-key]')
  };

  let state = { ...DEFAULTS };

  // Display ⌘ on macOS
  if (/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)) {
    els.modKeyLabel.textContent = '⌘';
  }

  function renderUI(settings) {
    state = { ...DEFAULTS, ...settings };
    if (state.chatWidth === '768px') {
      state.chatWidth = '800px';
    }

    els.toggleEnabled.checked = Boolean(state.enabled);
    els.settingsBody.classList.toggle('is-disabled', !state.enabled);
    els.statusLabel.textContent = state.enabled
      ? '1:1 对齐 ChatGPT · 实时生效'
      : '已暂停 · 显示原生 Gemini';

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

  // Bind Master Toggle & Boolean Switches
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

  // Bind Segmented Controls
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

  // Bind Reset Button
  els.resetBtn.addEventListener('click', () => {
    persistPatch({ ...DEFAULTS });
  });

  // Hydrate initial state
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      renderUI({ ...DEFAULTS, ...stored });
    });
  } else {
    renderUI(DEFAULTS);
  }
})();
