/** Apply cached visual preferences before the main content runtime is parsed. */
(function () {
  'use strict';
  const RG = globalThis.REFINED_GEMINI;
  const themeKey = `${RG.STORAGE_KEY}_theme`;
  let settings = RG.normalize({});
  let lastTheme;
  try {
    settings = RG.normalize(JSON.parse(localStorage.getItem(RG.STORAGE_KEY) || '{}'));
    lastTheme = localStorage.getItem(themeKey);
  } catch (_) { /* Defaults also work with unavailable page storage. */ }
  const ready = [];
  const themeListeners = [];
  let watchedRoot = null;
  let watchedBody = null;

  function nativeTheme() {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      if (el.classList.contains('dark-theme') || el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark') return 'dark';
      if (el.classList.contains('light-theme') || el.classList.contains('light') || el.getAttribute('data-theme') === 'light') return 'light';
      const scheme = el.style.colorScheme || el.getAttribute('color-scheme');
      if (scheme === 'dark' || scheme === 'light') return scheme;
    }
    return null;
  }

  function resolveTheme(mode) {
    if (mode === 'light' || mode === 'dark') return mode;
    const native = nativeTheme();
    if (native && native !== lastTheme) {
      lastTheme = native;
      try { localStorage.setItem(themeKey, native); } catch (_) {}
    }
    return native || (lastTheme === 'dark' || lastTheme === 'light' ? lastTheme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function paint(notify = false) {
    const root = document.documentElement;
    if (!root) return;
    const attr = (name, value) => { if (root.getAttribute(name) !== String(value)) root.setAttribute(name, String(value)); };
    const prop = (name, value) => { if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value); };
    attr('data-rg-enabled', settings.enabled);
    if (!settings.enabled) {
      root.removeAttribute('data-rg-indent');
      for (const key of ['--rg-chat-max-width', '--rg-font-size', '--rg-indent-scale']) root.style.removeProperty(key);
      return;
    }
    const previous = root.getAttribute('data-rg-theme');
    const theme = resolveTheme(settings.themeMode);
    attr('data-rg-theme', theme);
    attr('data-rg-indent', settings.indentScale === '0' ? 'none' : 'scaled');
    attr('data-rg-hide-avatar', settings.hideAvatar);
    attr('data-rg-compact-sidebar', settings.compactSidebar);
    attr('data-rg-clean-view', settings.cleanView);
    attr('data-rg-heading-scale', settings.scaledHeadings ? 'scaled' : 'uniform');
    attr('data-rg-default-high', settings.defaultHighThinking);
    attr('data-rg-ctrl-enter', settings.ctrlEnterSend);
    prop('--rg-chat-max-width', settings.chatWidth);
    prop('--rg-font-size', settings.fontSize);
    prop('--rg-indent-scale', settings.indentScale);
    if (notify && previous && previous !== theme) themeListeners.forEach(fn => fn());
  }

  const themeObserver = new MutationObserver(() => paint(true));
  function attach() {
    const root = document.documentElement;
    if (!root) return;
    if (watchedRoot !== root) {
      watchedRoot = root;
      themeObserver.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme', 'color-scheme', 'style'] });
    }
    if (document.body && watchedBody !== document.body) {
      watchedBody = document.body;
      themeObserver.observe(watchedBody, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    }
    paint(true);
    while (ready.length) ready.shift()();
    if (watchedBody) structureObserver.disconnect();
  }
  const structureObserver = new MutationObserver(attach);
  globalThis.REFINED_GEMINI_STARTUP = {
    get settings() { return settings; },
    resolveTheme,
    whenRoot(fn) { if (document.documentElement) fn(); else ready.push(fn); },
    onThemeChange(fn) { themeListeners.push(fn); },
    apply(next) {
      settings = RG.normalize(next);
      try { localStorage.setItem(RG.STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
      paint();
      return settings;
    }
  };
  if (!document.body) structureObserver.observe(document, { childList: true, subtree: true });
  attach();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (!nativeTheme()) lastTheme = null;
    paint(true);
  });
})();
