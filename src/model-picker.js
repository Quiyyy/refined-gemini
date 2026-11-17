/** One-click model × thinking picker. Uses Gemini's own controls; no private APIs. */
globalThis.REFINED_GEMINI_STARTUP.whenRoot(function () {
  'use strict';

  const TRIGGER = '[data-test-id="bard-mode-menu-button"]';
  const MODEL = '[role="menuitemradio"][data-mode-id]';
  const THINKING = '[value="thinking_level"]';
  const LEVELS = [
    { key: 'low', zh: '低', en: 'Low' },
    { key: 'medium', zh: '中', en: 'Medium' },
    { key: 'high', zh: '高', en: 'High' }
  ];
  const root = document.documentElement;
  let panel = null;
  let opener = null;
  let busy = false;
  let internalClick = false;
  const handledContexts = new Set();
  let lastPath = location.pathname;
  let defaultTimer = 0;
  let session = null;
  let contextVersion = 0;
  const modeSelector = 'gem-segmented-button[data-value]';
  const contextKey = () => `${location.pathname}|${document.querySelector(`${modeSelector}.gem-segmented-button-selected`)?.getAttribute('data-value') || ''}`;
  let lastContext = contextKey();

  const enabled = () => root.getAttribute('data-rg-enabled') === 'true';
  const isNewChat = () => /^\/(?:u\/\d+\/)?app\/?$/.test(location.pathname);
  const isChinese = () => /^zh/i.test(document.documentElement.lang || navigator.language);
  const label = level => isChinese() ? level.zh : level.en;
  const unavailable = el => !el || el.disabled || el.getAttribute('aria-disabled') === 'true';
  const controlledMenu = el => el && document.getElementById(el.getAttribute('aria-controls'));
  const currentTrigger = button => button?.isConnected ? button : document.querySelector(TRIGGER);
  const triggerControl = button => button?.matches('button') ? button : button?.querySelector('button');

  function findMainMenu(button) {
    const live = currentTrigger(button);
    const menu = document.querySelector('[data-test-id="gem-mode-menu"][data-visible="true"]') ||
      controlledMenu(live) || controlledMenu(triggerControl(live));
    return menu?.isConnected && menu.getAttribute('data-visible') !== 'false' && menu.querySelector(MODEL) ? menu : null;
  }

  function menuClosed(button) {
    const live = currentTrigger(button);
    return !findMainMenu(live) && live?.getAttribute('aria-expanded') !== 'true' &&
      triggerControl(live)?.getAttribute('aria-expanded') !== 'true';
  }

  function nextNativeTurn() {
    return new Promise(resolve => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(resolve)), 0));
  }

  function toolbarConfirms(button, modelName, levelKey) {
    const live = currentTrigger(button);
    const name = modelName?.replace(/^\d+(?:\.\d+)*\s+/, '').trim().toLowerCase();
    const primary = live?.querySelector('.picker-primary-text')?.textContent.trim().toLowerCase();
    const secondary = live?.querySelector('.picker-secondary-text')?.textContent.trim();
    const level = LEVELS.find(item => item.key === levelKey);
    return name && primary === name && (secondary === level.zh || secondary?.toLowerCase() === level.en.toLowerCase());
  }

  function clickNative(el) {
    if (el?.matches(TRIGGER)) el = triggerControl(el) || el;
    if (!enabled() || unavailable(el)) throw new Error('Control unavailable');
    internalClick = true;
    try { el.click(); } finally { internalClick = false; }
  }

  function waitFor(read, signal) {
    return new Promise((resolve, reject) => {
      let observer;
      let timer;
      const finish = (error, value) => {
        observer?.disconnect();
        clearTimeout(timer);
        signal?.removeEventListener('abort', aborted);
        error ? reject(error) : resolve(value);
      };
      const aborted = () => finish(new DOMException('Picker context changed', 'AbortError'));
      const check = () => {
        if (signal?.aborted) return aborted();
        if (!enabled()) return finish(new Error('Styling paused'));
        try {
          const value = read();
          if (value) finish(null, value);
        } catch (error) { finish(error); }
      };
      observer = new MutationObserver(check);
      observer.observe(root, { childList: true, characterData: true, subtree: true, attributes: true,
        attributeFilter: ['aria-expanded', 'aria-checked', 'aria-controls', 'aria-label', 'data-visible', 'data-rg-enabled'] });
      timer = setTimeout(() => finish(new Error('Menu unavailable')), 2500);
      signal?.addEventListener('abort', aborted, { once: true });
      check();
    });
  }

  async function mainMenu(button, signal) {
    button = await waitFor(() => currentTrigger(button), signal);
    if (!findMainMenu(button)) {
      await waitFor(() => menuClosed(button), signal);
      // Gemini finishes its desktop menu teardown after MutationObserver delivery.
      // Reopening inside that microtask is ignored even though aria-expanded is false.
      await nextNativeTurn();
      signal?.throwIfAborted();
      button = currentTrigger(button);
      if (!findMainMenu(button)) clickNative(button);
    }
    return waitFor(() => findMainMenu(button), signal);
  }

  async function thinkingMenu(menu, signal) {
    const item = menu.querySelector(THINKING);
    if (unavailable(item)) throw new Error('Thinking levels unavailable');
    const getLevels = () => {
      const submenu = controlledMenu(item);
      if (submenu?.isConnected && levelItems(submenu).length) return submenu;
      // Narrow layouts expand levels inside this item instead of using a submenu.
      return item.isConnected && levelItems(item).length ? item : null;
    };
    if (!getLevels()) clickNative(item);
    return waitFor(() => {
      return getLevels();
    }, signal);
  }

  function levelItems(menu) {
    return [...menu.querySelectorAll('[role="menuitemradio"]')].map(el => {
      const text = (el.querySelector('.label')?.textContent || el.textContent).trim();
      return { el, level: LEVELS.find(level => text === level.zh || text.toLowerCase() === level.en.toLowerCase()) };
    }).filter(item => item.level);
  }

  function closeNative(button) {
    button = currentTrigger(button);
    if (button?.isConnected && findMainMenu(button)) {
      internalClick = true;
      try { (triggerControl(button) || button).click(); } finally { internalClick = false; }
    }
  }

  function closePanel(restoreFocus = false) {
    panel?.remove();
    panel = null;
    if (restoreFocus) triggerControl(currentTrigger(opener))?.focus({ preventScroll: true });
  }

  async function nativeSession(button, action) {
    if (busy) return;
    busy = true;
    const controller = new AbortController();
    session = { controller, button };
    root.setAttribute('data-rg-picker-bridge', 'true');
    try {
      return await action(await mainMenu(button, controller.signal), controller.signal);
    } finally {
      if (!controller.signal.aborted) closeNative(button);
      root.removeAttribute('data-rg-picker-bridge');
      session = null;
      busy = false;
      scheduleDefault();
    }
  }

  function resetContext() {
    contextVersion++;
    closePanel();
    if (session) {
      session.controller.abort();
      closeNative(session.button);
    }
    clearTimeout(defaultTimer);
    defaultTimer = 0;
  }

  function showError() {
    globalThis.__RG_PAGE__?.toast(isChinese() ? '未能完成选择，请在原菜单中确认' : 'Selection incomplete. Please check the original menu.');
  }

  async function applyChoice(button, modelId, levelKey) {
    await nativeSession(button, async (menu, signal) => {
        const expectedModel = modelId || menu.querySelector(`${MODEL}[aria-checked="true"]`)?.getAttribute('data-mode-id');
        if (modelId) {
          const model = [...menu.querySelectorAll(MODEL)].find(el => el.getAttribute('data-mode-id') === modelId);
          if (unavailable(model)) throw new Error('Model unavailable');
          if (model.getAttribute('aria-checked') !== 'true') {
            clickNative(model);
            // The checked state can update before Gemini finishes dismissing the old
            // overlay. Reusing it races its delayed close and loses the level choice.
            await waitFor(() => menuClosed(button), signal);
            button = await waitFor(() => currentTrigger(button), signal);
            menu = await mainMenu(button, signal);
            await waitFor(() => [...menu.querySelectorAll(MODEL)].some(el => el.getAttribute('data-mode-id') === modelId && el.getAttribute('aria-checked') === 'true'), signal);
          }
        }
        // Tasks currently expose models only. Do not invent thinking controls or
        // attempt to change a strength through a menu that Gemini does not offer.
        if (!levelKey || unavailable(menu.querySelector(THINKING))) return;
        const levels = levelItems(await thinkingMenu(menu, signal));
        const target = levels.find(item => item.level.key === levelKey)?.el;
        if (unavailable(target)) throw new Error('Thinking level unavailable');
        const selectedModel = menu.querySelector(`${MODEL}[aria-checked="true"]`);
        const modelName = selectedModel?.querySelector('.sublabel')?.textContent.trim();
        if (target.getAttribute('aria-checked') !== 'true') {
          clickNative(target);
          await waitFor(() => menuClosed(button), signal);
          // When Gemini explicitly renders the requested model and strength, that
          // is already confirmation; avoid reopening a menu just to read it again.
          if (selectedModel?.getAttribute('data-mode-id') === expectedModel && toolbarConfirms(button, modelName, levelKey)) return;
          menu = await mainMenu(button, signal);
        }
        const finalLevels = await thinkingMenu(menu, signal);
        // Both desktop and narrow Gemini expose authoritative checked states here.
        // Toolbar text may omit the strength or use its secondary label for a model.
        await waitFor(() =>
          menu.querySelector(`${MODEL}[aria-checked="true"]`)?.getAttribute('data-mode-id') === expectedModel &&
          levelItems(finalLevels).some(item => item.level.key === levelKey && item.el.getAttribute('aria-checked') === 'true'), signal);
    });
  }

  function element(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function positionPanel() {
    if (!panel || !opener?.isConnected) return closePanel();
    const rect = opener.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const left = Math.max(8, Math.min(rect.right - width, innerWidth - width - 8));
    const top = rect.top >= height + 16 ? rect.top - height - 8 : Math.min(rect.bottom + 8, innerHeight - height - 8);
    panel.style.left = `${left}px`;
    panel.style.top = `${Math.max(8, top)}px`;
  }

  function render(models, levels) {
    const modelOnly = levels.length === 0;
    panel = element('div', 'rg-model-picker');
    panel.id = 'rg-model-picker';
    panel.setAttribute('role', 'dialog');
    panel.classList.toggle('rg-picker-model-only', modelOnly);
    panel.setAttribute('aria-label', modelOnly ? (isChinese() ? '模型' : 'Model') : (isChinese() ? '模型与思考强度' : 'Model and thinking level'));
    const head = element('div', 'rg-picker-head');
    head.append(element('span', '', isChinese() ? '模型' : 'Model'));
    if (!modelOnly) head.append(element('span', 'rg-picker-strength-label', isChinese() ? '思考强度' : 'Thinking level'));
    panel.append(head);
    for (const model of models) {
      const row = element('div', 'rg-picker-row');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', model.name);
      const modelLabel = element('span', 'rg-picker-model');
      const versionedName = model.name.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
      modelLabel.append(element('span', 'rg-picker-model-name', versionedName ? versionedName[2] : model.name));
      if (versionedName) modelLabel.append(element('span', 'rg-picker-version', versionedName[1]));
      row.append(modelLabel);
      const choices = element('div', 'rg-picker-levels');
      for (const level of modelOnly ? [null] : LEVELS) {
        const choice = element('button', 'rg-picker-choice', level ? label(level) : '');
        choice.type = 'button';
        choice.disabled = model.disabled || (!modelOnly && !levels.some(item => item.key === level.key));
        choice.setAttribute('aria-label', modelOnly ? model.name : `${model.name} · ${label(level)}`);
        choice.setAttribute('aria-pressed', String(model.selected && (modelOnly || levels.some(item => item.key === level.key && item.selected))));
        if (modelOnly) {
          choice.append(modelLabel, element('span', 'rg-picker-check', model.selected ? '✓' : ''));
        }
        choice.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          handledContexts.add(contextKey());
          const button = opener;
          const version = contextVersion;
          closePanel(true);
          // Finish the custom click before opening Gemini's native overlays, so
          // its outside-click handlers cannot dismiss a newly opened menu.
          queueMicrotask(async () => {
            if (version !== contextVersion) return;
            try { await applyChoice(button, model.id, level?.key); }
            catch (error) { if (error.name !== 'AbortError') showError(); }
          });
        });
        (modelOnly ? row : choices).append(choice);
      }
      if (!modelOnly) row.append(choices);
      panel.append(row);
    }
    document.body.append(panel);
    positionPanel();
    (panel.querySelector('[aria-pressed="true"]:not(:disabled)') || panel.querySelector('button:not(:disabled)'))?.focus({ preventScroll: true });
  }

  async function openPanel(button) {
    opener = button;
    const version = contextVersion;
    try {
      const data = await nativeSession(button, async (menu, signal) => ({
        models: [...menu.querySelectorAll(MODEL)].map(el => ({
          id: el.getAttribute('data-mode-id'),
          name: (el.querySelector('.sublabel')?.textContent || el.querySelector('.label')?.textContent || '').trim(),
          selected: el.getAttribute('aria-checked') === 'true',
          disabled: unavailable(el) || Boolean(el.querySelector('[fonticon="lock"]'))
        })),
        levels: unavailable(menu.querySelector(THINKING)) ? [] : levelItems(await thinkingMenu(menu, signal)).map(({el, level}) => ({
          key: level.key, selected: el.getAttribute('aria-checked') === 'true', disabled: unavailable(el)
        })).filter(level => !level.disabled)
      }));
      if (data && enabled() && version === contextVersion) render(data.models, data.levels);
    } catch (error) {
      // Leave the original control usable if Gemini changes its menu structure.
      if (error.name !== 'AbortError' && version === contextVersion && enabled() && button.isConnected && !findMainMenu(button)) clickNative(button);
    }
  }

  document.addEventListener('click', event => {
    const mode = event.target instanceof Element && event.target.closest(modeSelector);
    if (mode && !mode.classList.contains('gem-segmented-button-selected')) resetContext();
    const button = event.target instanceof Element && event.target.closest(TRIGGER);
    if (button && enabled() && !internalClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handledContexts.add(contextKey());
      // A button ignores a nested .click() while its original click is dispatching.
      if (!busy) panel ? closePanel(true) : queueMicrotask(() => openPanel(button));
    }
    const link = event.target instanceof Element && event.target.closest('a[href]');
    if (link && (new URL(link.href).pathname === '/' || /^\/(?:u\/\d+\/)?app\/?$/.test(new URL(link.href).pathname))) {
      handledContexts.clear();
      resetContext();
      scheduleDefault();
    }
  }, true);

  document.addEventListener('pointerdown', event => {
    if (panel && !busy && !panel.contains(event.target) && !opener?.contains(event.target)) closePanel();
  }, true);
  document.addEventListener('keydown', event => {
    if (!panel) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closePanel(true);
    } else if (panel.contains(event.target) && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      const choices = [...panel.querySelectorAll('button:not(:disabled)')];
      const columns = panel.classList.contains('rg-picker-model-only') ? 1 : 3;
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key];
      const next = (choices.indexOf(event.target) + delta + choices.length) % choices.length;
      event.preventDefault();
      choices[next]?.focus();
    }
  }, true);
  window.addEventListener('resize', positionPanel, { passive: true });
  window.addEventListener('scroll', positionPanel, { passive: true, capture: true });

  function scheduleDefault() {
    if (lastPath !== location.pathname) {
      lastPath = location.pathname;
      handledContexts.clear();
    }
    if (lastContext !== contextKey()) {
      lastContext = contextKey();
      resetContext();
    }
    if (!enabled()) { if (panel || session) resetContext(); return; }
    if (!isNewChat() || handledContexts.has(contextKey()) || busy || defaultTimer || root.getAttribute('data-rg-default-high') !== 'true') return;
    defaultTimer = setTimeout(async () => {
      defaultTimer = 0;
      if (!enabled() || !isNewChat() || handledContexts.has(contextKey()) || busy || root.getAttribute('data-rg-default-high') !== 'true') return;
      const button = document.querySelector(TRIGGER);
      if (unavailable(button) || unavailable(triggerControl(button))) return;
      if (findMainMenu(button)) return;
      // Gemini may autofocus an empty composer. Preserve actual drafts while still
      // applying the default to an untouched empty editor and restoring its focus.
      const focus = document.activeElement;
      if (focus?.matches('textarea, input, [contenteditable="true"]') &&
          String('value' in focus ? focus.value : focus.textContent).trim()) {
        handledContexts.add(contextKey());
        return;
      }
      handledContexts.add(contextKey());
      try { await applyChoice(button, null, 'high'); }
      catch (_) { /* Leave Gemini's native choice intact when high is unavailable. */ }
      finally { if (focus?.isConnected && focus !== document.body) focus.focus({ preventScroll: true }); }
    }, 250);
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => record.attributeName !== 'class' || record.target.matches(modeSelector))) scheduleDefault();
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['data-rg-enabled', 'data-rg-default-high', 'aria-label', 'class'] });
  window.addEventListener('popstate', scheduleDefault);
  scheduleDefault();
});
