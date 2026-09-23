/**
 * Status & Master Emergency Modal Component
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

export function renderStatusModalHtml() {
  return `
    <div class="modal-box">
      <button class="modal-close" data-close="statusModal" aria-label="Close Status">✕</button>
      <h2>💡 LED Status Meaning</h2>
      <div class="muted status-help">
        <span class="led green"></span> <b style="color:#4ade80">Blinking green</b> = value below warning threshold
        <br><br>
        <span class="led red"></span> <b style="color:#f87171">Blinking red</b> = value at/above warning threshold
      </div>
      <hr>
      <h3>🚨 Emergency Control</h3>
      <p class="muted">Emergency commands are sent only after you click the button. After sending, the dashboard waits for ESP32 acknowledgement; it does not mark the command as executed by itself.</p>
      <button id="emergencyAll" class="emergency-all">🚨 HOLD 2s — MASTER EMERGENCY ALL STATIONS</button>
      <div id="commandLog" class="muted" style="margin-top:10px">No commands sent yet.</div>
    </div>
  `;
}
