/**
 * Human-friendly time formatting helpers.
 */

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0s";
  }
  const s = Math.floor(totalSeconds);
  if (s < 60) {
    return `${s}s`;
  }
  const m = Math.floor(s / 60);
  if (m < 60) {
    const remS = s % 60;
    return remS > 0 ? `${m}m ${remS}s` : `${m}m`;
  }
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) {
    return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
  }
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH > 0 ? `${d}d ${remH}h` : `${d}d`;
}

export function formatDecimalHours(totalSeconds: number): string {
  return (totalSeconds / 3600).toFixed(2);
}

export function formatTodayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}
