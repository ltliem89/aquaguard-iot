/**
 * Water Level History Chart Module
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

export function drawChart(rows, canvasId = 'chart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#26364d';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui';

  // 5 grid lines
  for (let i = 0; i <= 4; i++) {
    const y = 25 + (i * (h - 50)) / 4;
    ctx.beginPath();
    ctx.moveTo(45, y);
    ctx.lineTo(w - 15, y);
    ctx.stroke();
  }

  const vals = (rows || []).map(r => Number(r.water_level_cm)).filter(Number.isFinite);
  if (!vals.length) {
    ctx.fillText('No data', 50, 60);
    return;
  }

  const max = Math.max(50, ...vals);
  const min = Math.min(0, ...vals);
  const range = max === min ? 1 : max - min;

  ctx.fillText(max.toFixed(0) + ' cm', 5, 28);
  ctx.fillText(min.toFixed(0) + ' cm', 5, h - 20);

  const by = { 1: [], 2: [], 3: [], 4: [] };
  rows.slice().reverse().forEach(r => {
    if (by[r.station_id]) {
      by[r.station_id].push(r);
    }
  });

  const series = [1, 2, 3, 4];
  const seriesColors = ['#38bdf8', '#4ade80', '#fbbf24', '#f87171'];

  series.forEach((id, si) => {
    const a = by[id];
    if (!a || !a.length) return;

    ctx.beginPath();
    a.forEach((r, i) => {
      const x = 55 + i * Math.max(1, (w - 75) / Math.max(1, a.length - 1));
      const y = 25 + ((max - Number(r.water_level_cm)) / range) * (h - 50);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = seriesColors[si];
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}
