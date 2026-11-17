/** In-page turn navigation. Excerpts stay in memory and follow Gemini's rendered DOM. */
(function () {
  'use strict';

  function start() {
    const root = document.documentElement;
    const nav = document.createElement('nav');
    nav.id = 'rg-message-history';
    nav.hidden = true;
    const preview = document.createElement('div');
    preview.id = 'rg-message-preview';
    preview.setAttribute('role', 'tooltip');
    preview.hidden = true;
    const meta = document.createElement('div');
    meta.className = 'rg-history-meta';
    const question = document.createElement('div');
    question.className = 'rg-history-question';
    const answer = document.createElement('div');
    answer.className = 'rg-history-answer';
    preview.append(meta, question, answer);
    document.body.append(nav, preview);

    let entries = [];
    let scroller = null;
    let sidebars = [];
    const sidebarSelector = 'bard-sidenav, mat-sidenav, side-navigation-content';
    let scanTimer = 0;
    let frame = 0;
    let active = -1;
    let hovered = -1;
    let lastPath = location.pathname;
    let highlighted = null;
    let highlightTimer = 0;
    const narrowScreen = matchMedia('(max-width: 767.98px)');
    let waveFrame = 0;
    let pointerY = null;
    let waveFromPointer = false;
    let waveMarks = new Set();
    const zh = () => /^zh/i.test(root.lang || navigator.language);
    const own = node => (node.nodeType === 1 ? node : node.parentElement)?.closest('#rg-message-history, #rg-message-preview');
    const compact = text => (text || '').replace(/\s+/g, ' ').trim();
    const visible = el => el?.isConnected && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';

    function hidePreview() {
      hovered = -1;
      preview.hidden = true;
    }

    function resetWave() {
      cancelAnimationFrame(waveFrame);
      waveFrame = 0;
      pointerY = null;
      waveFromPointer = false;
      for (const mark of waveMarks) {
        mark.style.removeProperty('--rg-history-scale');
        mark.style.removeProperty('--rg-history-opacity');
      }
      waveMarks.clear();
    }

    function drawWave() {
      waveFrame = 0;
      if (pointerY === null || nav.hidden || !entries.length) return;
      const first = entries[0].button;
      const step = first.offsetHeight;
      if (!step) return;
      const firstTop = first.offsetTop;
      const y = pointerY - nav.getBoundingClientRect().top + nav.scrollTop;
      const center = Math.round((y - firstTop - step / 2) / step);
      const next = new Set();
      // Only the nearby ticks change; the rest remain equal-length at rest.
      for (let i = Math.max(0, center - 4); i <= Math.min(entries.length - 1, center + 4); i++) {
        const distance = (firstTop + i * step + step / 2 - y) / (step * 1.5);
        const strength = Math.exp(-0.5 * distance * distance);
        const mark = entries[i].button.firstElementChild;
        mark.style.setProperty('--rg-history-scale', (1 + 2 * strength).toFixed(3));
        mark.style.setProperty('--rg-history-opacity', (0.4 + 0.6 * strength).toFixed(3));
        next.add(mark);
      }
      for (const mark of waveMarks) {
        if (!next.has(mark)) {
          mark.style.removeProperty('--rg-history-scale');
          mark.style.removeProperty('--rg-history-opacity');
        }
      }
      waveMarks = next;
    }

    function scheduleWave(y) {
      pointerY = y;
      if (!waveFrame) waveFrame = requestAnimationFrame(drawWave);
    }

    function showPreview(index) {
      const entry = entries[index];
      if (!entry || nav.hidden) return;
      hovered = index;
      meta.textContent = `${zh() ? '对话' : 'Turn'} ${index + 1} / ${entries.length}`;
      question.textContent = entry.text;
      const reply = entry.anchor.querySelector('model-response .markdown, model-response message-content, [data-testid="assistant-turn"]');
      answer.textContent = compact(reply?.textContent).slice(0, 160) || (zh() ? '暂无回复预览' : 'No reply preview yet');
      preview.hidden = false;
      const rect = entry.button.getBoundingClientRect();
      const width = Math.min(260, innerWidth - 48);
      preview.style.width = `${width}px`;
      preview.style.left = `${Math.max(8, Math.min(rect.right + 10, innerWidth - width - 8))}px`;
      preview.style.top = `${Math.max(8, Math.min(rect.top - 24, innerHeight - preview.offsetHeight - 12))}px`;
    }

    function jump(index) {
      const entry = entries[index];
      if (!entry?.anchor.isConnected || !scroller) return;
      hidePreview();
      const top = scroller.scrollTop + entry.anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 24;
      scroller.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      highlighted?.classList.remove('rg-history-target');
      clearTimeout(highlightTimer);
      highlighted = entry.anchor;
      highlighted.classList.add('rg-history-target');
      highlightTimer = setTimeout(() => {
        highlighted?.classList.remove('rg-history-target');
        highlighted = null;
      }, 1100);
      schedulePosition();
    }

    function updatePosition() {
      frame = 0;
      nav.hidden = root.getAttribute('data-rg-enabled') !== 'true' || narrowScreen.matches || entries.length < 3 || !visible(scroller);
      if (nav.hidden) { hidePreview(); resetWave(); return; }
      const bounds = scroller.getBoundingClientRect();
      const first = entries[0].anchor.getBoundingClientRect();
      let leftEdge = Math.max(0, bounds.left);
      for (const sidebar of sidebars) {
        if (!visible(sidebar)) continue;
        const rect = sidebar.getBoundingClientRect();
        // Ignore full-page component hosts and offscreen/closed drawers.
        if (!sidebar.contains(scroller) && rect.width > 0 && rect.right > 0 && rect.left < bounds.right && rect.bottom > bounds.top && rect.top < bounds.bottom) {
          leftEdge = Math.max(leftEdge, rect.right);
        }
      }
      // Composited drawer movement can lead JS geometry by a frame. Keep the rail
      // hidden until the drawer settles, then fit it into the final safe gutter.
      if (sidebars.some(el => el.getAnimations().some(animation => animation.playState === 'running'))) {
        nav.hidden = true;
        hidePreview();
        resetWave();
        schedulePosition();
        return;
      }
      const contentLeft = first.left + parseFloat(getComputedStyle(entries[0].anchor).paddingLeft || 0);
      const minLeft = leftEdge + 8;
      const maxLeft = Math.min(contentLeft, bounds.right, innerWidth) - nav.offsetWidth - 8;
      // Fit the ENTIRE hit area and wave between the sidebar and the text, with
      // clearance on both sides. Never clamp against the window's left edge alone.
      if (maxLeft < minLeft) { nav.hidden = true; hidePreview(); resetWave(); return; }
      nav.style.left = `${Math.min(Math.max(leftEdge + 20, minLeft), maxLeft)}px`;
      let bottom = Math.min(bounds.bottom, innerHeight) - 16;
      const composer = document.querySelector('input-container, input-area-v2');
      if (visible(composer)) {
        const rect = composer.getBoundingClientRect();
        if (rect.top > bounds.top + 80) bottom = Math.min(bottom, rect.top - 12);
      }
      const top = Math.max(64, bounds.top + 16);
      const available = Math.max(0, bottom - top);
      nav.style.maxHeight = `${Math.floor(Math.min(220, available * 0.45))}px`;
      nav.style.top = `${top + Math.max(0, (available - nav.offsetHeight) / 2)}px`;
      let next = 0;
      const readingLine = bounds.top + Math.min(120, bounds.height * 0.25);
      let lo = 0, hi = entries.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (entries[mid].anchor.getBoundingClientRect().top <= readingLine) { next = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      if (scroller.scrollHeight > scroller.clientHeight + 4 && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop < 3) next = entries.length - 1;
      if (next !== active) {
        entries[active]?.button.removeAttribute('aria-current');
        active = next;
        const button = entries[active].button;
        button.setAttribute('aria-current', 'true');
        if (!nav.matches(':hover, :focus-within')) {
          if (button.offsetTop < nav.scrollTop) nav.scrollTop = button.offsetTop;
          else if (button.offsetTop + button.offsetHeight > nav.scrollTop + nav.clientHeight) nav.scrollTop = button.offsetTop + button.offsetHeight - nav.clientHeight;
        }
      }
      if (hovered >= 0) showPreview(hovered);
      if (pointerY !== null) scheduleWave(pointerY);
    }

    function schedulePosition() {
      if (!frame) frame = requestAnimationFrame(updatePosition);
    }

    function findScroller(anchor) {
      for (let el = anchor.parentElement; el && el !== document.body; el = el.parentElement) {
        if (el.matches('infinite-scroller.chat-history, #chat-history') || /auto|scroll/.test(getComputedStyle(el).overflowY)) return el;
      }
      return null;
    }

    function scan() {
      scanTimer = 0;
      const enabled = root.getAttribute('data-rg-enabled') === 'true';
      const changedPage = lastPath !== location.pathname;
      lastPath = location.pathname;
      if (changedPage || !enabled) hidePreview();
      const seen = new Set();
      const next = enabled ? [...document.querySelectorAll('user-query, [data-testid="user-turn"]')].filter(visible).map(query => {
        const anchor = query.closest('.conversation-container, [data-turn-content-visibility]') || query;
        if (seen.has(anchor)) return null;
        seen.add(anchor);
        const lines = [...query.querySelectorAll('.query-text-line')];
        const content = query.querySelector('[data-testid="user-prompt-content"], [contenteditable="true"][role="textbox"]');
        const text = compact(lines.length ? lines.map(el => el.textContent).join(' ') : content?.textContent || query.querySelector('.query-text')?.textContent);
        return { anchor, text: text || (zh() ? '附件消息' : 'Attachment message') };
      }).filter(Boolean) : [];
      const nextScroller = next.length ? findScroller(next[0].anchor) : null;
      const changed = changedPage || scroller !== nextScroller || entries.length !== next.length || next.some((e, i) => e.anchor !== entries[i]?.anchor || e.text !== entries[i]?.text);
      const nextSidebars = [...document.querySelectorAll(sidebarSelector)];
      if (scroller !== nextScroller || sidebars.length !== nextSidebars.length || nextSidebars.some((el, i) => el !== sidebars[i])) {
        resizeObserver.disconnect();
        layoutObserver.disconnect();
        if (nextScroller) resizeObserver.observe(nextScroller);
        for (const el of nextSidebars) {
          resizeObserver.observe(el);
          layoutObserver.observe(el, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
        }
      }
      sidebars = nextSidebars;
      scroller = nextScroller;
      nav.setAttribute('aria-label', zh() ? '消息历史，点击定位' : 'Message history, click to jump');
      nav.hidden = !enabled || !scroller || next.length < 3 || narrowScreen.matches;
      if (changed) {
        const focused = nav.contains(document.activeElement) ? entries.findIndex(e => e.button === document.activeElement) : -1;
        hidePreview();
        resetWave();
        active = -1;
        entries = next;
        const fragment = document.createDocumentFragment();
        entries.forEach((entry, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.setAttribute('aria-label', `${index + 1}. ${entry.text.slice(0, 140)}`);
          button.setAttribute('aria-describedby', preview.id);
          const mark = document.createElement('span');
          mark.setAttribute('aria-hidden', 'true');
          button.append(mark);
          button.addEventListener('pointerenter', () => showPreview(index));
          button.addEventListener('focus', () => {
            waveFromPointer = false;
            showPreview(index);
            const rect = button.getBoundingClientRect();
            scheduleWave(rect.top + rect.height / 2);
          });
          button.addEventListener('click', () => jump(index));
          entry.button = button;
          fragment.append(button);
        });
        nav.replaceChildren(fragment);
        if (focused >= 0 && !nav.hidden) entries[Math.min(focused, entries.length - 1)]?.button.focus({ preventScroll: true });
      }
      schedulePosition();
    }

    function scheduleScan() {
      if (!scanTimer) scanTimer = setTimeout(scan, 100);
    }

    const resizeObserver = new ResizeObserver(schedulePosition);
    const layoutObserver = new MutationObserver(schedulePosition);
    nav.addEventListener('pointermove', event => {
      if (event.pointerType !== 'touch') {
        waveFromPointer = true;
        scheduleWave(event.clientY);
      }
    });
    nav.addEventListener('pointerleave', () => { hidePreview(); resetWave(); });
    nav.addEventListener('scroll', () => {
      const focused = entries.findIndex(entry => entry.button === document.activeElement);
      if (!waveFromPointer && focused >= 0) {
        showPreview(focused);
        const rect = entries[focused].button.getBoundingClientRect();
        scheduleWave(rect.top + rect.height / 2);
        return;
      }
      hidePreview();
      if (pointerY !== null) scheduleWave(pointerY);
    }, { passive: true });
    nav.addEventListener('focusout', event => { if (!nav.contains(event.relatedTarget)) { hidePreview(); resetWave(); } });
    nav.addEventListener('keydown', event => {
      if (event.key === 'Escape') { hidePreview(); resetWave(); return; }
      const index = entries.findIndex(e => e.button === event.target);
      const next = { ArrowUp: Math.max(0, index - 1), ArrowDown: Math.min(entries.length - 1, index + 1), Home: 0, End: entries.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      entries[next]?.button.focus({ preventScroll: true });
      const button = entries[next]?.button;
      if (button) nav.scrollTop = Math.max(0, button.offsetTop - nav.clientHeight / 2);
    });
    document.addEventListener('pointerdown', event => { if (!nav.contains(event.target)) hidePreview(); }, true);
    window.addEventListener('scroll', event => { if (event.target !== nav) schedulePosition(); }, { capture: true, passive: true });
    window.addEventListener('resize', schedulePosition, { passive: true });
    document.addEventListener('transitionrun', event => {
      if (event.target instanceof Element && event.target.closest(sidebarSelector)) {
        nav.hidden = true;
        hidePreview();
        resetWave();
        schedulePosition();
      }
    }, true);
    document.addEventListener('transitionend', event => {
      if (event.target instanceof Element && event.target.closest(sidebarSelector)) schedulePosition();
    }, true);
    window.addEventListener('popstate', scheduleScan);
    new MutationObserver(records => {
      const relevant = records.filter(record => !own(record.target));
      if (!relevant.length) return;
      const turns = 'user-query, [data-testid="user-turn"]';
      const structure = `${turns}, ${sidebarSelector}`;
      if (relevant.some(record => {
        if (record.type === 'attributes') return true;
        const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        if (target?.closest(turns)) return true;
        return [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 && (node.matches(structure) || node.querySelector(structure)));
      })) scheduleScan();
      else schedulePosition();
    }).observe(root, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['data-rg-enabled', 'lang'] });
    scan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
