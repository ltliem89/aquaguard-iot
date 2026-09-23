/**
 * Emergency & Reset Module
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 * 
 * Rules:
 * 1. Station Emergency: 1-click immediate send, no 2-second hold.
 * 2. Reset: ONLY resets the targeted station.
 * 3. Master Emergency: 2-second hold + confirmation dialog + sends to S1-S4.
 * 4. Persistent emergency state: Remains red until reset is executed.
 * 5. ACK: Frontend only marks "sent — waiting for ESP32".
 */

import { insertDeviceCommand, fetchLatestCommands as apiFetchLatestCommands } from '../services/supabase.js';

export const emergencyStations = {};

export function getCard(id) {
  return document.getElementById('station-card-' + id);
}

export function setEmergencyVisual(id, active) {
  const card = getCard(id);
  if (!card) return;

  card.classList.toggle('emergency-active', active);

  const btn = card.querySelector('.btn-danger');
  if (btn) {
    btn.classList.toggle('emergency-button-active', active);
    if (active) {
      btn.style.background = '#d90000';
      btn.style.color = '#fff';
      btn.style.borderColor = '#ff0000';
      btn.style.boxShadow = '0 0 14px rgba(255, 0, 0, 0.95)';
    } else {
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.style.boxShadow = '';
    }
  }
}

export function keepEmergencyRed(stationId) {
  emergencyStations[stationId] = true;
  setEmergencyVisual(stationId, true);
}

export function clearEmergencyRed(stationId) {
  delete emergencyStations[stationId];
  setEmergencyVisual(stationId, false);

  const card = getCard(stationId);
  if (card) {
    const reset = card.querySelector('.btn-reset');
    if (reset) {
      reset.classList.add('resetting');
      setTimeout(() => reset.classList.remove('resetting'), 700);
    }
  }
}

export function restoreEmergencyVisuals() {
  [1, 2, 3, 4].forEach(id => {
    if (emergencyStations[id]) {
      setEmergencyVisual(id, true);
    } else {
      setEmergencyVisual(id, false);
    }
  });
}

export async function sendCommand(stationId, command, value) {
  const el = document.getElementById('cmd-' + stationId);
  const commandLog = document.getElementById('commandLog');
  const label = value === 'ON' ? 'Emergency ON' : 'Reset / OFF';

  if (el) {
    el.textContent = 'Sending...';
    el.className = 'command-status pending';
  }

  try {
    await insertDeviceCommand(stationId, command, value);

    // The command has been successfully written to Supabase.
    // It is NOT marked "executed" until the ESP32 acknowledges it.
    if (el) {
      el.textContent = `✓ ${label} sent`;
      el.className = 'command-status sent';
    }

    if (command === 'EMERGENCY' && value === 'ON') {
      keepEmergencyRed(stationId);
      if (commandLog) {
        commandLog.textContent = `🚨 S${stationId}: EMERGENCY ACTIVE at ${new Date().toLocaleTimeString()} — waiting for ESP32`;
      }
    } else {
      if (command === 'EMERGENCY' && value === 'OFF') {
        clearEmergencyRed(stationId);
      }
      if (commandLog) {
        commandLog.textContent = `✓ S${stationId}: ${label} sent at ${new Date().toLocaleTimeString()} — waiting for ESP32`;
      }
    }
  } catch (e) {
    if (el) {
      el.textContent = 'Command error: ' + e.message;
      el.className = 'command-status error';
    }
    if (commandLog) {
      commandLog.textContent = `Error sending command to S${stationId}: ${e.message}`;
    }
  }
}

export async function resetStation(stationId) {
  const card = getCard(stationId);
  const btn = card?.querySelector('.btn-reset');
  const emergencyBtn = card?.querySelector('.btn-danger');
  const commandLog = document.getElementById('commandLog');

  if (btn) btn.classList.add('resetting');
  try {
    await sendCommand(stationId, 'EMERGENCY', 'OFF');
    if (emergencyBtn) emergencyBtn.classList.remove('emergency-arming');
    clearEmergencyRed(stationId);
    if (commandLog) {
      commandLog.textContent = `🟢 S${stationId}: RESET sent at ${new Date().toLocaleTimeString()} — only S${stationId} was reset`;
    }
  } finally {
    setTimeout(() => {
      if (btn) btn.classList.remove('resetting');
    }, 650);
  }
}

export async function emergencyAll() {
  const ok = window.confirm('Send MASTER EMERGENCY to S1, S2, S3 and S4?');
  if (!ok) return;

  const commandLog = document.getElementById('commandLog');
  if (commandLog) commandLog.textContent = 'Sending MASTER EMERGENCY to S1–S4...';

  try {
    await Promise.all([1, 2, 3, 4].map(id => sendCommand(id, 'EMERGENCY', 'ON')));
    document.body.classList.add('emergency-active');
    if (commandLog) {
      commandLog.textContent = `🚨 MASTER EMERGENCY commands sent to S1–S4 at ${new Date().toLocaleTimeString()} — waiting for ESP32`;
    }
  } catch (e) {
    if (commandLog) commandLog.textContent = 'Emergency error: ' + e.message;
  }
}

export function attachEmergencyHold(button, action) {
  let timer = null;
  let fired = false;

  const restoreButton = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!fired) button.classList.remove('emergency-arming');
    fired = false;
  };

  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    button.setPointerCapture?.(e.pointerId);

    // Stage 1: button turns red immediately while waiting for 2 seconds.
    fired = false;
    button.classList.add('emergency-arming');

    timer = setTimeout(async () => {
      fired = true;
      timer = null;

      if (navigator.vibrate) navigator.vibrate([120, 80, 120]);

      // Stage 2: send the actual command. sendCommand() then activates
      // the station's persistent red emergency state after Supabase accepts it.
      await action();

      // Keep the Emergency button red until Reset.
      button.classList.add('emergency-arming');
    }, 2000);
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(evt => {
    button.addEventListener(evt, () => {
      // Releasing before 2 seconds cancels the emergency and restores the button.
      if (!fired) restoreButton();
    });
  });
}

export function setupEmergencyHold() {
  // Station Emergency is an immediate action. No 2-second hold.
  document.querySelectorAll('.station .btn-danger').forEach(btn => {
    const card = btn.closest('.station');
    if (!card) return;
    const m = card.id.match(/station-card-(\d+)/);
    if (m) {
      const stationId = Number(m[1]);
      btn.onclick = () => sendCommand(stationId, 'EMERGENCY', 'ON');
    }
  });

  // Master Emergency keeps the original 2-second hold safety behavior.
  const master = document.getElementById('emergencyAll');
  if (master && !master.dataset.holdAttached) {
    master.dataset.holdAttached = 'true';
    attachEmergencyHold(master, emergencyAll);
  }
}

export async function syncLatestCommands() {
  const rows = await apiFetchLatestCommands();
  const latest = {};
  rows.forEach(r => {
    const id = Number(r.station_id);
    if (!latest[id]) latest[id] = r;
  });

  [1, 2, 3, 4].forEach(id => {
    const r = latest[id];
    if (!r) return;
    const active = String(r.value).toUpperCase() === 'ON';
    if (active) {
      emergencyStations[id] = true;
    } else {
      delete emergencyStations[id];
    }
  });

  return latest;
}
