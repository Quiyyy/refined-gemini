/**
 * Refined Gemini — Background Service Worker (Manifest V3)
 *
 * Responsibilities:
 *   1. Keyboard command (default Alt+Shift+G) to instantly toggle styling on/off
 *      for quick "native vs refined" comparison without opening the popup.
 *   2. Toolbar badge ("OFF") so a paused state is always visible at a glance.
 */
importScripts('defaults.js');

const RG = self.REFINED_GEMINI;
const GEMINI_URL = 'https://gemini.google.com/';

function readSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(RG.DEFAULTS, (stored) => resolve(RG.normalize(stored)));
  });
}

function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#8E8EA0' });
  if (chrome.action.setBadgeTextColor) chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
}

async function getShortcut() {
  try {
    const commands = await chrome.commands.getAll();
    const cmd = commands.find((c) => c.name === 'toggle-styling');
    return (cmd && cmd.shortcut) || '';
  } catch (_) {
    return '';
  }
}

async function toggleStyling(tab) {
  const settings = await readSettings();
  const enabled = !settings.enabled;
  await chrome.storage.sync.set({ enabled });
  updateBadge(enabled);

  // Show an in-page confirmation toast on the active Gemini tab
  if (tab && tab.id != null && tab.url && tab.url.startsWith(GEMINI_URL)) {
    const shortcut = await getShortcut();
    chrome.tabs.sendMessage(tab.id, { type: 'RG_TOGGLED', enabled, shortcut }).catch(() => {});
  }
}

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'toggle-styling') return;
  if (tab) {
    toggleStyling(tab);
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => toggleStyling(tabs && tabs[0]));
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) updateBadge(changes.enabled.newValue !== false);
});

chrome.runtime.onInstalled.addListener(() => readSettings().then((s) => updateBadge(s.enabled)));
chrome.runtime.onStartup.addListener(() => readSettings().then((s) => updateBadge(s.enabled)));
