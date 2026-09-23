/**
 * Stations Module
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

import { fetchStations as apiFetchStations } from '../services/supabase.js';
import { renderStationCard, ZONES } from '../components/station-card.js';
import { sendCommand, resetStation, setupEmergencyHold, restoreEmergencyVisuals } from './emergency.js';
import { updateStationConnectionUI } from './connection.js';

let stationStatusCache = {
  1: { id: 1, station_code: 'S1', status: 'offline', last_seen: null },
  2: { id: 2, station_code: 'S2', status: 'offline', last_seen: null },
  3: { id: 3, station_code: 'S3', status: 'offline', last_seen: null },
  4: { id: 4, station_code: 'S4', status: 'offline', last_seen: null }
};

export function getStationStatusCache() {
  return stationStatusCache;
}

export async function loadStations() {
  try {
    const rows = await apiFetchStations();
    rows.forEach(r => {
      stationStatusCache[r.id] = r;
    });
    return rows;
  } catch (err) {
    // Keep cache intact on temporary failure
    return Object.values(stationStatusCache);
  }
}

export function renderStations(latestReadings = {}, containerId = 'stations') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = [1, 2, 3, 4]
    .map(id => renderStationCard(id, latestReadings[id] || null, stationStatusCache[id]))
    .join('');

  // Wire up action buttons
  container.querySelectorAll('button[data-emergency-station]').forEach(btn => {
    const stationId = Number(btn.getAttribute('data-emergency-station'));
    btn.onclick = () => sendCommand(stationId, 'EMERGENCY', 'ON');
  });

  container.querySelectorAll('button[data-reset-station]').forEach(btn => {
    const stationId = Number(btn.getAttribute('data-reset-station'));
    btn.onclick = () => resetStation(stationId);
  });

  setupEmergencyHold();
  restoreEmergencyVisuals();
  updateStationConnectionUI(stationStatusCache);
}
