/**
 * Settings Modal Component
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

import { getSupabaseConfig, saveSupabaseConfig } from '../services/supabase.js';

export function renderSettingsModalHtml() {
  const config = getSupabaseConfig();
  return `
    <div class="modal-box">
      <button class="modal-close" data-close="settingsModal" aria-label="Close Settings">✕</button>
      <h2>⚙ Settings</h2>
      <label for="url">Supabase Project URL</label>
      <input id="url" value="${config.url}">
      <label for="key" style="margin-top:10px">Publishable / anon key</label>
      <input id="key" type="password" placeholder="Paste your public key" value="${config.key}">
      <div class="modal-actions">
        <button id="start">Connect / Start</button>
        <button id="stop" style="background:#dc2626" disabled>Stop</button>
      </div>
      <div class="muted" id="updated" style="margin-top:10px">—</div>
      <div id="settingsConnectionResult" class="settings-connection-result" role="status" aria-live="polite">
        <span id="settingsConnectionIcon" class="settings-connection-icon">✓</span>
        <div id="settingsConnectionText"></div>
      </div>
      <div class="muted note">Use only the Supabase publishable/anon key here. Never paste a service_role/secret key into this page.</div>
      <button id="settingsCloseBottom" class="settings-close-bottom" type="button">Đóng</button>
    </div>
  `;
}

export function showSettingsConnectionResult(success, message) {
  const box = document.getElementById('settingsConnectionResult');
  const icon = document.getElementById('settingsConnectionIcon');
  const text = document.getElementById('settingsConnectionText');
  if (!box || !icon || !text) return;

  box.className = 'settings-connection-result show ' + (success ? 'success' : 'error');
  icon.textContent = success ? '✓' : '!';
  text.innerHTML = success
    ? '<b>Kết nối thành công</b><br>' + message
    : '<b>Kết nối thất bại</b><br>' + message;
}
