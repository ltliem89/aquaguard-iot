/**
 * Threshold Modal Component
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

export function renderThresholdModalHtml() {
  return `
    <div class="modal-box modal-wide">
      <button class="modal-close" data-close="thresholdModal" aria-label="Close Thresholds">✕</button>
      <h2>⚙ Alert Thresholds</h2>
      <p class="muted threshold-help">Each variable is evaluated independently: below Warning → blinking green; at/above Warning → blinking red.</p>
      <div id="thresholds" class="threshold-grid"></div>
    </div>
  `;
}
