/** Compact live model picker. Uses Gemini's own choices; no model catalog or private APIs. */
globalThis.REFINED_GEMINI_STARTUP.whenRoot(function () {
  'use strict';

  const TRIGGER = '[data-test-id="bard-mode-menu-button"]';
  const MODEL = '[role="menuitemradio"][data-mode-id]';
  const THINKING = '[value="thinking_level"]';
  const root = document.documentElement;
  let panel = null;
  let submenu = null;
  let submenuOwner = null;
  let leaveTimer = 0;
  let hoverTimer = 0;
  let previewJob = null;
  let hoveredRow = null;
  const modelLevels = new Map();
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
  const clean = text => (text || '').replace(/\s+/g, ' ').trim();
  // Translate presentation only; selection still uses the native option key.
  const levelLabel = text => ({ '低': 'Low', '中': 'Medium', '高': 'High', low: 'Low', medium: 'Medium', high: 'High' }[clean(text).toLowerCase()] || text);
  // Older menus put a versioned model in the sublabel; Auto now puts prose there.
  // Recognize the version format, never a fixed list of model names or IDs.
  function modelName(el) {
    const primary = clean(el.querySelector('.label')?.textContent);
    const secondary = clean(el.querySelector('.sublabel')?.textContent);
    return /^(?:Gemini\s+)?\d+(?:\.\d+)*\s+\S/i.test(secondary) ? secondary : primary || secondary;
  }
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
    return name && primary === name && secondary?.toLowerCase() === levelKey;
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
    const submenu = await waitFor(getLevels, signal);
    submenu.setAttribute('data-rg-thinking-menu', 'true');
    return submenu;
  }

  function levelItems(menu) {
    return [...menu.querySelectorAll('[role="menuitemradio"]:not([data-mode-id])')].map(el => {
      const text = clean(el.querySelector('.label')?.textContent || el.textContent);
      return { el, level: { key: text.toLowerCase(), text } };
    }).filter(item => item.level.text);
  }

  function closeNative(button) {
    button = currentTrigger(button);
    if (button?.isConnected && findMainMenu(button)) {
      internalClick = true;
      try { (triggerControl(button) || button).click(); } finally { internalClick = false; }
    }
  }

  function closePanel(restoreFocus = false) {
    clearTimeout(hoverTimer);
    hoveredRow = null;
    closeSubmenu();
    panel?.remove();
    panel = null;
    if (!busy && findMainMenu(opener)) {
      // A native handler can reopen its menu while our panel owns the UI.
      // Dismiss that leftover too, without exposing its closing animation.
      closeNative(opener);
      void waitFor(() => menuClosed(opener)).catch(() => {}).finally(() => {
        if (!panel) root.removeAttribute('data-rg-picker-open');
      });
    } else root.removeAttribute('data-rg-picker-open');
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
      try {
        if (!controller.signal.aborted) {
          closeNative(button);
          // Clicking requests dismissal; the overlay may remain mounted through
          // its close animation. Keep it hidden until native closure is confirmed.
          await waitFor(() => menuClosed(button), controller.signal);
        }
      } finally {
        root.removeAttribute('data-rg-picker-bridge');
        session = null;
        busy = false;
        scheduleDefault();
      }
    }
  }

  function resetContext() {
    contextVersion++;
    modelLevels.clear();
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
        if (!levelKey) return;
        if (unavailable(menu.querySelector(THINKING))) {
          if (levelKey === '__preferHigh') return;
          throw new Error('Thinking levels unavailable');
        }
        const levels = levelItems(await thinkingMenu(menu, signal));
        if (levelKey === '__preferHigh') {
          levelKey = levels.find(item => /^(high|高)$/i.test(item.level.text) && !unavailable(item.el))?.level.key;
          if (!levelKey) return;
        }
        const target = levels.find(item => item.level.key === levelKey)?.el;
        if (unavailable(target)) throw new Error('Thinking level unavailable');
        const selectedModel = menu.querySelector(`${MODEL}[aria-checked="true"]`);
        const selectedName = selectedModel && modelName(selectedModel);
        if (target.getAttribute('aria-checked') !== 'true') {
          clickNative(target);
          await waitFor(() => menuClosed(button), signal);
          // When Gemini explicitly renders the requested model and strength, that
          // is already confirmation; avoid reopening a menu just to read it again.
          if (selectedModel?.getAttribute('data-mode-id') === expectedModel && toolbarConfirms(button, selectedName, levelKey)) return;
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
    opener = currentTrigger(opener);
    if (!panel || !opener?.isConnected) return closePanel();
    const rect = opener.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const left = Math.max(8, Math.min(rect.right - width, innerWidth - width - 8));
    const top = rect.top >= height + 16 ? rect.top - height - 8 : Math.min(rect.bottom + 8, innerHeight - height - 8);
    panel.style.left = `${left}px`;
    panel.style.top = `${Math.max(8, top)}px`;
    positionSubmenu();
  }

  function select(modelId, levelKey) {
    handledContexts.add(contextKey());
    const button = opener;
    const version = contextVersion;
    closePanel(true);
    queueMicrotask(async () => {
      if (previewJob) await previewJob.catch(() => {});
      if (version !== contextVersion || !enabled()) return;
      try { await applyChoice(button, modelId, levelKey); }
      catch (error) { if (error.name !== 'AbortError') showError(); }
    });
  }

  function closeSubmenu() {
    clearTimeout(leaveTimer);
    submenuOwner?.setAttribute('aria-expanded', 'false');
    submenuOwner?.classList.remove('rg-picker-hover');
    submenu?.remove();
    submenu = null;
    submenuOwner = null;
  }

  function positionSubmenu() {
    if (!submenu || !submenuOwner?.isConnected || !panel) return;
    const bounds = panel.getBoundingClientRect();
    const row = submenuOwner.getBoundingClientRect();
    const width = submenu.offsetWidth;
    // Match the reference's side flyout; flip left if needed. On phones place
    // the same menu above/below the row, inside the viewport.
    const right = bounds.right - 1;
    const left = right + width <= innerWidth - 8 ? right : bounds.left - width + 1;
    const x = left >= 8 ? left : Math.max(8, innerWidth - width - 8);
    const y = left >= 8 ? row.top - 4 : (row.top >= submenu.offsetHeight + 8 ? row.top - submenu.offsetHeight : row.bottom);
    submenu.style.left = x + 'px';
    submenu.style.top = Math.max(8, Math.min(y, innerHeight - submenu.offsetHeight - 8)) + 'px';
  }

  function flyout(row, name) {
    if (submenuOwner === row) return false;
    closeSubmenu();
    submenuOwner = row;
    row.setAttribute('aria-expanded', 'true');
    row.classList.add('rg-picker-hover');
    submenu = element('div', 'rg-picker-submenu');
    submenu.setAttribute('role', 'menu');
    submenu.setAttribute('aria-label', name);
    submenu.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
    panel.append(submenu);
    return true;
  }

  function showLevels(row, model, levels, focus = false) {
    if (!levels.length) return;
    if (flyout(row, isChinese() ? '思考强度' : 'Thinking level')) {
      for (const level of levels) {
        const choice = element('button', 'rg-picker-choice');
        choice.type = 'button';
        choice.disabled = level.disabled;
        choice.setAttribute('role', 'menuitemradio');
        choice.setAttribute('aria-label', model.name + ' · ' + levelLabel(level.text));
        choice.setAttribute('aria-checked', String(level.selected));
        choice.append(element('span', '', levelLabel(level.text)), element('span', 'rg-picker-check', level.selected ? '✓' : ''));
        choice.addEventListener('click', () => select(model.id, level.key));
        submenu.append(choice);
      }
      positionSubmenu();
    }
    if (focus) submenu.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  }

  async function readData(button) {
    return nativeSession(button, async (menu, signal) => ({
      models: [...menu.querySelectorAll(MODEL)].map(el => ({
        id: el.getAttribute('data-mode-id'), name: modelName(el),
        selected: el.getAttribute('aria-checked') === 'true',
        disabled: unavailable(el) || Boolean(el.querySelector('[fonticon="lock"]')),
        automatic: /^(auto|自动)$/i.test(clean(el.querySelector('.label')?.textContent)),
        badge: clean(el.querySelector('.badge')?.textContent)
      })),
      levels: unavailable(menu.querySelector(THINKING)) ? [] : levelItems(await thinkingMenu(menu, signal)).map(({el, level}) => ({
        key: level.key, text: level.text, selected: el.getAttribute('aria-checked') === 'true', disabled: unavailable(el)
      }))
    }));
  }

  function previewLevels(model, row, original, originalLevel, focus = false) {
    clearTimeout(hoverTimer);
    hoveredRow = row;
    if (modelLevels.has(model.id)) {
      const levels = modelLevels.get(model.id);
      if (levels.length) showLevels(row, model, levels, focus);
      else closeSubmenu();
      return;
    }
    closeSubmenu();
    const ownerPanel = panel;
    const version = contextVersion;
    hoverTimer = setTimeout(async () => {
      if (previewJob) await previewJob.catch(() => {});
      if (hoveredRow !== row || panel !== ownerPanel || version !== contextVersion || !original) return;
      row.setAttribute('aria-busy', 'true');
      const button = opener;
      const job = (async () => {
        let switched = false;
        try {
          // Read this model's actual native controls, then restore the original
          // selection before offering choices. Never reuse another model's levels.
          switched = true;
          await applyChoice(button, model.id, null);
          if (version !== contextVersion || !enabled()) return;
          const data = await readData(button);
          if (data) modelLevels.set(model.id, data.levels.map(level => ({ ...level, selected: false })));
        } finally {
          if (switched && version === contextVersion && enabled()) await applyChoice(button, original.id, originalLevel?.key);
        }
      })();
      previewJob = job;
      try {
        await job;
        if (hoveredRow === row && panel === ownerPanel && version === contextVersion) {
          const levels = modelLevels.get(model.id) || [];
          if (levels.length) showLevels(row, model, levels, focus);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && panel === ownerPanel) { closePanel(); showError(); }
      } finally {
        row.removeAttribute('aria-busy');
        if (previewJob === job) previewJob = null;
      }
    }, focus ? 0 : 140);
  }

  function render(models, levels) {
    panel = element('div', 'rg-model-picker');
    panel.id = 'rg-model-picker';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', isChinese() ? '模型选择' : 'Model selection');
    panel.append(element('div', 'rg-picker-head', isChinese() ? '模型' : 'Model'));
    const list = element('div', 'rg-picker-models');
    const currentLevel = levels.find(level => level.selected);
    const task = document.querySelector(modeSelector + '.gem-segmented-button-selected')?.getAttribute('data-value') === '40';
    const original = models.find(model => model.selected);
    modelLevels.clear();
    if (original) modelLevels.set(original.id, levels);
    for (const model of models) {
      const row = element('button', 'rg-picker-row');
      row.type = 'button'; row.disabled = model.disabled;
      row.setAttribute('aria-label', model.name);
      row.setAttribute('aria-pressed', String(model.selected));
      const expandable = !task && !model.automatic && (!model.selected || levels.length > 0);
      if (expandable) { row.setAttribute('aria-haspopup', 'menu'); row.setAttribute('aria-expanded', 'false'); }
      row.append(element('span', 'rg-picker-model-name', model.name));
      if (model.selected && currentLevel) row.append(element('span', 'rg-picker-current-level', levelLabel(currentLevel.text)));
      if (model.badge) row.append(element('span', 'rg-picker-badge', model.badge));
      const mark = element('span', 'rg-picker-check', model.selected ? '✓' : expandable ? '›' : '');
      mark.setAttribute('aria-hidden', 'true'); row.append(mark);
      row.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch' || model.disabled) return;
        clearTimeout(leaveTimer);
        if (expandable) previewLevels(model, row, original, currentLevel);
        else { clearTimeout(hoverTimer); hoveredRow = row; closeSubmenu(); }
      });
      row.addEventListener('click', () => {
        if (model.selected && levels.length) showLevels(row, model, levels, true);
        else if (expandable) previewLevels(model, row, original, currentLevel, true);
        else select(model.id, null);
      });
      row.addEventListener('keydown', event => {
        if (event.key !== 'ArrowRight' || !expandable) return;
        event.preventDefault(); event.stopPropagation();
        if (model.selected) showLevels(row, model, levels, true);
        else previewLevels(model, row, original, currentLevel, true);
      });
      list.append(row);
    }
    panel.append(list);
    panel.addEventListener('pointerenter', () => clearTimeout(leaveTimer));
    panel.addEventListener('pointerleave', () => { clearTimeout(hoverTimer); hoveredRow = null; leaveTimer = setTimeout(closeSubmenu, 180); });
    root.setAttribute('data-rg-picker-open', 'true');
    document.body.append(panel); positionPanel();
    (list.querySelector('[aria-pressed="true"]:not(:disabled)') || list.querySelector('button:not(:disabled)'))?.focus({ preventScroll: true });
  }

  async function openPanel(button) {
    opener = button;
    const version = contextVersion;
    try {
      const data = await readData(button);
      if (data && enabled() && version === contextVersion) render(data.models, data.levels);
    } catch (error) {
      // Leave the original control usable if Gemini changes its menu structure.
      if (error.name !== 'AbortError' && version === contextVersion && enabled()) {
        closePanel();
        button = currentTrigger(button);
        if (button?.isConnected && !findMainMenu(button)) clickNative(button);
      }
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
    if (panel && !panel.contains(event.target) && !opener?.contains(event.target)) closePanel();
  }, true);
  document.addEventListener('keydown', event => {
    if (!panel) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closePanel(true);
    } else if (panel.contains(event.target)) {
      if (event.key === 'ArrowLeft' && submenu?.contains(event.target)) {
        event.preventDefault(); const owner = submenuOwner; closeSubmenu(); owner?.focus({ preventScroll: true }); return;
      }
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      const scope = submenu?.contains(event.target) ? submenu : panel;
      const choices = [...scope.querySelectorAll('button:not(:disabled)')].filter(el => scope === submenu || !submenu?.contains(el));
      const current = choices.indexOf(event.target);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (current + (event.key === 'ArrowUp' ? -1 : 1) + choices.length) % choices.length;
      event.preventDefault(); choices[next]?.focus({ preventScroll: true });
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
      try { await applyChoice(button, null, '__preferHigh'); }
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
