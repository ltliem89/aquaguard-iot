/**
 * Latest Records Table Module
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

export function renderRecords(rows, zones, containerId = 'records') {
  const tbody = document.getElementById(containerId);
  if (!tbody) return;

  tbody.innerHTML = (rows || []).slice(0, 20).map(r => `<tr>
    <td>${new Date(r.created_at).toLocaleTimeString()}</td>
    <td>${zones[r.station_id]?.[0] || r.station_id}</td>
    <td>${r.water_level_cm} cm</td>
    <td>${r.pressure_kpa}</td>
    <td>${r.flow_rate}</td>
    <td>${r.temperature_c} °C</td>
    <td>${r.humidity_percent} %</td>
  </tr>`).join('');
}
