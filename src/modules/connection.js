/**
 * Station Connection Status & Heartbeat Tracking
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 * 
 * Rules:
 * - stations.last_seen is the sole source of truth for connection state.
 * - Never use stations.status or frontend ping to declare an ESP32 online.
 * - ageSeconds <= 25s: ONLINE
 * - ageSeconds <= 30s: UNSTABLE
 * - ageSeconds > 30s or missing: OFFLINE
 */

export function getStationConnectionStatus(lastSeen) {
  if (!lastSeen) return { state: 'OFFLINE', className: 'offline', ageSeconds: Infinity };
  const last = Date.parse(lastSeen);
  if (!Number.isFinite(last)) return { state: 'OFFLINE', className: 'offline', ageSeconds: Infinity };
  const ageSeconds = Math.max(0, (Date.now() - last) / 1000);
  if (ageSeconds <= 25) return { state: 'ONLINE', className: 'online', ageSeconds };
  if (ageSeconds <= 30) return { state: 'UNSTABLE', className: 'unstable', ageSeconds };
  return { state: 'OFFLINE', className: 'offline', ageSeconds };
}

export function formatHeartbeatAge(lastSeen) {
  if (!lastSeen) return 'No heartbeat';
  const last = Date.parse(lastSeen);
  if (!Number.isFinite(last)) return 'No heartbeat';
  const s = Math.max(0, Math.floor((Date.now() - last) / 1000));
  if (s < 2) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function updateStationConnectionUI(stationStatusCache) {
  [1, 2, 3, 4].forEach(id => {
    const station = stationStatusCache[id];
    const info = getStationConnectionStatus(station?.last_seen);
    const card = document.getElementById('station-card-' + id);
    if (!card) return;
    const dot = card.querySelector('.connection-dot');
    const label = card.querySelector('.connection-label');
    const age = card.querySelector('.station-heartbeat-age');
    if (dot) dot.className = `connection-dot ${info.className}`;
    if (label) {
      label.textContent = info.state;
      label.className = `connection-label ${info.className}`;
    }
    if (age) age.textContent = `• ${formatHeartbeatAge(station?.last_seen)}`;
    card.dataset.connectionState = info.state;
  });

  const states = [1, 2, 3, 4].map(id => getStationConnectionStatus(stationStatusCache[id]?.last_seen).state);
  const online = states.filter(s => s === 'ONLINE').length;
  const unstable = states.filter(s => s === 'UNSTABLE').length;
  const offline = 4 - online - unstable;
  const summary = document.getElementById('stationNetworkSummary');
  if (summary) {
    summary.textContent = `ESP32: ${online}/4 ONLINE` +
      (unstable ? ` • ${unstable} UNSTABLE` : '') +
      (offline ? ` • ${offline} OFFLINE` : '');
  }
}
