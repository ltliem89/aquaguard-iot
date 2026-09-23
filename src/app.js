/**
 * App Controller
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

import { fetchRows, saveSupabaseConfig, getSupabaseConfig } from './services/supabase.js';
import { loadStations, renderStations, getStationStatusCache } from './modules/stations.js';
import { loadThresholds, renderThresholdCards } from './modules/thresholds.js';
import { syncLatestCommands, restoreEmergencyVisuals, setupEmergencyHold } from './modules/emergency.js';
import { updateStationConnectionUI } from './modules/connection.js';
import { drawChart } from './modules/chart.js';
import { renderRecords } from './modules/records.js';
import { ZONES } from './components/station-card.js';
import { showSettingsConnectionResult } from './components/settings-modal.js';
import { setupPWA } from './components/pwa-install.js';

let pollingTimer = null;
let lastRenderedThresholdIds = '';
let isRefreshing = false;

export async function refresh() {
  if (isRefreshing) return;
  isRefreshing = true;

  const dot = document.getElementById('dot');
  const conn = document.getElementById('conn');
  const updated = document.getElementById('updated');

  try {
    const [rows, stationRows, thresholds] = await Promise.all([
      fetchRows(),
      loadStations(),
      loadThresholds(),
      syncLatestCommands()
    ]);

    const thresholdIds = thresholds.map(x => x.station_id).join(',');
    if (thresholdIds !== lastRenderedThresholdIds) {
      renderThresholdCards(thresholds);
      lastRenderedThresholdIds = thresholdIds;
    }

    const latest = {};
    rows.forEach(r => {
      if (!latest[r.station_id]) latest[r.station_id] = r;
    });

    renderStations(latest);
    restoreEmergencyVisuals();

    renderRecords(rows, ZONES);
    drawChart(rows);

    if (dot) dot.className = 'dot ok';
    if (conn) conn.textContent = 'Connected';
    if (updated) updated.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (e) {
    if (dot) dot.className = 'dot bad';
    if (conn) conn.textContent = 'Error';
    if (updated) updated.textContent = e.message;
    // Don't kill UI: update connection indicators with cached last seen
    updateStationConnectionUI(getStationStatusCache());
  } finally {
    isRefreshing = false;
  }
}

export function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
}

export function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
}

export function setupModals() {
  document.getElementById('settingsBtn')?.addEventListener('click', () => openModal('settingsModal'));
  document.getElementById('statusBtn')?.addEventListener('click', () => openModal('statusModal'));
  document.getElementById('thresholdBtn')?.addEventListener('click', () => openModal('thresholdModal'));

  document.querySelectorAll('.modal-close').forEach(b => {
    b.addEventListener('click', () => closeModal(b.dataset.close));
  });

  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) closeModal(m.id);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(m => closeModal(m.id));
    }
  });

  document.getElementById('settingsCloseBottom')?.addEventListener('click', () => {
    closeModal('settingsModal');
  });
}

export function setupControls() {
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');
  const urlInput = document.getElementById('url');
  const keyInput = document.getElementById('key');
  const updated = document.getElementById('updated');

  if (startBtn) {
    startBtn.onclick = async () => {
      if (pollingTimer) return;

      // Persist user inputs
      if (urlInput && keyInput) {
        saveSupabaseConfig(urlInput.value, keyInput.value);
      }

      startBtn.disabled = true;
      if (stopBtn) stopBtn.disabled = false;
      if (updated) updated.textContent = 'Đang kiểm tra kết nối…';

      try {
        await refresh();

        const connected = document.getElementById('conn')?.textContent === 'Connected';
        if (!connected) {
          throw new Error(updated?.textContent || 'Không thể kết nối Supabase.');
        }

        pollingTimer = setInterval(refresh, 1000);
        showSettingsConnectionResult(
          true,
          'Supabase đã kết nối. Dashboard đang tự động cập nhật dữ liệu.'
        );
      } catch (e) {
        startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        showSettingsConnectionResult(false, e.message || 'Không thể kết nối Supabase.');
      }
    };
  }

  if (stopBtn) {
    stopBtn.onclick = () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
      if (startBtn) startBtn.disabled = false;
      stopBtn.disabled = true;
      const dot = document.getElementById('dot');
      const conn = document.getElementById('conn');
      if (dot) dot.className = 'dot';
      if (conn) conn.textContent = 'Stopped';
      showSettingsConnectionResult(false, 'Đã dừng kết nối và polling dữ liệu.');
    };
  }
}

export function initApp() {
  setupModals();
  setupControls();
  setupEmergencyHold();
  setupPWA();

  // Initial render of empty station cards
  renderStations({});

  // Heartbeat UI update interval (1 second)
  setInterval(() => {
    updateStationConnectionUI(getStationStatusCache());
  }, 1000);

  // Populate input fields with active config
  const config = getSupabaseConfig();
  const urlInput = document.getElementById('url');
  const keyInput = document.getElementById('key');
  if (urlInput && config.url) urlInput.value = config.url;
  if (keyInput && config.key) keyInput.value = config.key;

  // Auto-connect if anon key is already provided via .env, default, or localStorage
  if (config.key) {
    const startBtn = document.getElementById('start');
    if (startBtn) startBtn.click();
  }
}
