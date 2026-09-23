/**
 * Station Card Component
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

import { getThresholdForStation } from '../modules/thresholds.js';
import { getStationConnectionStatus, formatHeartbeatAge } from '../modules/connection.js';
import { emergencyStations } from '../modules/emergency.js';

export const ZONES = {
  1: ['S1', 'Drainage Zone'],
  2: ['S2', 'Green Retention Zone'],
  3: ['S3', 'Residential Zone'],
  4: ['S4', 'Urban Industrial Zone']
};

export function renderStationCard(id, d, stationInfo = null) {
  const [code, name] = ZONES[id];
  const t = getThresholdForStation(id);

  const val = field => (d && d[field] !== null && d[field] !== undefined ? Number(d[field]) : null);
  const water = val('water_level_cm');
  const flow = val('flow_rate');
  const temp = val('temperature_c');
  const hum = val('humidity_percent');

  // Per-variable rule: below warning threshold = blinking green; at/above warning = blinking red.
  const led = (value, warning) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'gray';
    if (warning === null || warning === undefined || warning === '' || !Number.isFinite(Number(warning))) return 'gray';
    return Number(value) >= Number(warning) ? 'red' : 'green';
  };

  const anyAlert =
    (water !== null && water >= Number(t.water_warning_cm)) ||
    (flow !== null && flow >= Number(t.flow_warning)) ||
    (temp !== null && temp >= Number(t.temperature_warning)) ||
    (hum !== null && hum >= Number(t.humidity_warning));

  const stationClass = anyAlert ? 'crit' : '';
  const stationLabel = anyAlert ? '⚠ ALERT' : '● NORMAL';
  const stateClass = anyAlert ? 'alert' : 'normal';

  const metric = (label, value, unit, warning) => {
    const valid = value !== null && value !== undefined && Number.isFinite(Number(value));
    const validWarning = warning !== null && warning !== undefined && warning !== '' && Number.isFinite(Number(warning));
    const state = !valid ? 'gray' : !validWarning ? 'gray' : Number(value) >= Number(warning) ? 'red' : 'green';
    return `<div class="metric">
      <small>${label}</small>
      <b>${value === null ? '—' : value.toFixed(1)} ${unit}<span class="led ${state}" title="${state === 'red' ? 'Above warning threshold' : 'Below warning threshold'}"></span></b>
      <small>Warning: ${warning}</small>
    </div>`;
  };

  const emergencyActive = !!emergencyStations[id];
  const connection = getStationConnectionStatus(stationInfo?.last_seen);

  return `<div class="station ${stationClass}${emergencyActive ? ' emergency-active' : ''}" id="station-card-${id}" data-connection-state="${connection.state}">
    <div class="station-head">
      <div>
        <h2>${code}</h2><div class="zone">${name}</div>
        <div class="station-connection">
          <span class="connection-dot ${connection.className}"></span>
          <b class="connection-label ${connection.className}">${connection.state}</b>
          <span class="station-heartbeat-age">• ${formatHeartbeatAge(stationInfo?.last_seen)}</span>
        </div>
      </div>
      <div class="station-state ${stateClass}">${stationLabel}</div>
    </div>
    <div class="big">${water === null ? '—' : water.toFixed(1)}</div>
    <div class="unit">water level (cm)<span class="led ${led(water, t.water_warning_cm)}"></span></div>
    <div class="metrics">
      ${metric('Pressure', d ? Number(d.pressure_kpa) : null, 'kPa', '—')}
      ${metric('Flow', flow, '', t.flow_warning)}
      ${metric('Temperature', temp, '°C', t.temperature_warning)}
      ${metric('Humidity', hum, '%', t.humidity_warning)}
    </div>
    <div class="controls">
      <button class="btn-danger" data-emergency-station="${id}">🚨 Emergency</button>
      <button class="btn-reset" data-reset-station="${id}">↺ Reset</button>
    </div>
    <div id="cmd-${id}" class="command-status">No command sent.</div>
    <div class="muted" style="margin-top:9px">Last data: ${d ? new Date(d.created_at).toLocaleString() : 'No data'}</div>
  </div>`;
}
