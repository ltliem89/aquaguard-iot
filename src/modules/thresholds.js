/**
 * Alert Thresholds Module
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

import { fetchThresholds as apiFetchThresholds, saveThresholdApi } from '../services/supabase.js';

export const DEFAULT_THRESHOLDS = {
  water_warning_cm: 50,
  water_critical_cm: 70,
  flow_warning: 5,
  flow_critical: 8,
  temperature_warning: 35,
  temperature_critical: 40,
  humidity_warning: 85,
  humidity_critical: 95
};

let thresholdCache = {};

export function getThresholdCache() {
  return thresholdCache;
}

export function getThresholdForStation(stationId) {
  return thresholdCache[stationId] || DEFAULT_THRESHOLDS;
}

export async function loadThresholds() {
  const rows = await apiFetchThresholds();
  thresholdCache = {};
  rows.forEach(r => {
    thresholdCache[r.station_id] = r;
  });
  return rows;
}

export function renderThresholdCards(rows, containerId = 'thresholds') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = rows.map(r => `
    <div class="threshold-card">
      <h3 style="margin:0 0 10px">S${r.station_id}</h3>
      <label>Water Warning (cm)<input id="tw-${r.station_id}" type="number" step="0.1" value="${r.water_warning_cm}"></label>
      <label>Water Critical (cm)<input id="tc-${r.station_id}" type="number" step="0.1" value="${r.water_critical_cm}"></label>
      <label>Flow Warning<input id="fw-${r.station_id}" type="number" step="0.1" value="${r.flow_warning}"></label>
      <label>Flow Critical<input id="fc-${r.station_id}" type="number" step="0.1" value="${r.flow_critical}"></label>
      <label>Temp Warning (°C)<input id="tempw-${r.station_id}" type="number" step="0.1" value="${r.temperature_warning}"></label>
      <label>Temp Critical (°C)<input id="tempc-${r.station_id}" type="number" step="0.1" value="${r.temperature_critical}"></label>
      <label>Humidity Warning (%)<input id="hw-${r.station_id}" type="number" step="0.1" value="${r.humidity_warning}"></label>
      <label>Humidity Critical (%)<input id="hc-${r.station_id}" type="number" step="0.1" value="${r.humidity_critical}"></label>
      <button class="btn-success" style="width:100%" data-station-id="${r.station_id}">💾 Save S${r.station_id}</button>
      <div id="th-status-${r.station_id}" class="command-status"></div>
    </div>`).join('');

  // Attach button click listeners
  container.querySelectorAll('button[data-station-id]').forEach(btn => {
    const stationId = Number(btn.getAttribute('data-station-id'));
    btn.onclick = () => saveThreshold(stationId);
  });
}

export async function saveThreshold(id, onSavedCallback) {
  const get = n => Number(document.getElementById(n + id)?.value);
  const statusEl = document.getElementById('th-status-' + id);

  const vals = {
    water_warning_cm: get('tw-'),
    water_critical_cm: get('tc-'),
    flow_warning: get('fw-'),
    flow_critical: get('fc-'),
    temperature_warning: get('tempw-'),
    temperature_critical: get('tempc-'),
    humidity_warning: get('hw-'),
    humidity_critical: get('hc-'),
    updated_at: new Date().toISOString()
  };

  if (
    vals.water_warning_cm >= vals.water_critical_cm ||
    vals.flow_warning >= vals.flow_critical ||
    vals.temperature_warning >= vals.temperature_critical ||
    vals.humidity_warning >= vals.humidity_critical
  ) {
    if (statusEl) {
      statusEl.textContent = 'Warning value must be lower than Critical value.';
      statusEl.className = 'command-status error';
    }
    return;
  }

  if (statusEl) {
    statusEl.textContent = 'Saving...';
    statusEl.className = 'command-status pending';
  }

  try {
    await saveThresholdApi(id, vals);
    thresholdCache[id] = { ...(thresholdCache[id] || {}), ...vals };
    if (statusEl) {
      statusEl.textContent = 'Saved successfully.';
      statusEl.className = 'command-status executed';
    }
    if (typeof onSavedCallback === 'function') {
      await onSavedCallback();
    }
  } catch (e) {
    if (statusEl) {
      statusEl.textContent = e.message;
      statusEl.className = 'command-status error';
    }
  }
}
