/**
 * Inline HTML/CSS/JS for the dashboard webview. Kept simple so we can
 * bundle it into the extension without a separate build step.
 *
 * The webview receives data via `acquireVsCodeApi().postMessage` from the
 * extension host and renders charts as plain HTML bars (no external libs).
 */
export function dashboardHtml(data: {
  signedIn: boolean;
  range: "today" | "7d" | "30d";
  totalSeconds: number;
  linesAdded: number;
  linesRemoved: number;
  byProject: Array<{
    name: string;
    seconds: number;
    color: string;
    linesAdded: number;
    linesRemoved: number;
  }>;
  byLanguage: Array<{ name: string; seconds: number }>;
  byFile: Array<{
    name: string;
    seconds: number;
    language: string;
    linesAdded: number;
    linesRemoved: number;
    sessions: number;
    pct: number;
  }>;
  byDay: Array<{ date: string; seconds: number }>;
  streakDays: number;
  queuedCount: number;
}): string {
  const _projectBars = renderBars(
    data.byProject.map((p) => ({ name: p.name, value: p.seconds, color: p.color }))
  );
  const _languageBars = renderBars(
    data.byLanguage.map((l) => ({ name: l.name, value: l.seconds, color: "#5C9EAD" }))
  );
  const _sparkline = renderSparkline(data.byDay);
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  :root { color-scheme: light dark; }
  body { font-family: var(--vscode-font-family, sans-serif); padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
  h1 { font-size: 1.2em; margin: 0 0 4px; }
  h2 { font-size: 1em; margin: 18px 0 8px; opacity: 0.85; }
  .tabs { display: flex; gap: 6px; margin: 8px 0 16px; }
  .tabs button { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; padding: 4px 10px; cursor: pointer; border-radius: 3px; font-size: 12px; }
  .tabs button.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .card { background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-editorWidget-border); border-radius: 4px; padding: 8px 10px; }
  .card .label { font-size: 11px; opacity: 0.6; }
  .card .value { font-size: 18px; font-weight: 600; margin-top: 4px; }
  .row { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .row .name { width: 30%; font-size: 12px; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row .bar-track { flex: 1; height: 10px; background: var(--vscode-editorWidget-background); border-radius: 5px; overflow: hidden; }
  .row .bar-fill { height: 100%; border-radius: 5px; }
  .row .value { width: 80px; text-align: right; font-variant-numeric: tabular-nums; font-size: 12px; }
  .empty { opacity: 0.6; font-style: italic; }
  .footer { margin-top: 24px; font-size: 11px; opacity: 0.6; }
  .spark { margin-top: 4px; }
  .file-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
  .file-table th { text-align: left; opacity: 0.6; font-weight: 500; padding: 4px 8px; border-bottom: 1px solid var(--vscode-editorWidget-border); }
  .file-table td { padding: 6px 8px; border-bottom: 1px solid var(--vscode-editorWidget-border); }
  .file-table tr:last-child td { border-bottom: none; }
  .file-name { font-family: var(--vscode-editor-font-family, monospace); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lang-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-size: 11px; }
  .lines .add { color: #4caf50; }
  .lines .del { color: #f44336; }
  .mini-bar { display: flex; align-items: center; gap: 6px; }
  .mini-fill { height: 8px; background: #9CDB89; border-radius: 4px; min-width: 2px; }
</style>
</head>
<body>
  <h1>Work Tracker</h1>
  <div class="tabs">
    <button data-range="today" class="${data.range === "today" ? "active" : ""}">Today</button>
    <button data-range="7d" class="${data.range === "7d" ? "active" : ""}">Last 7 days</button>
    <button data-range="30d" class="${data.range === "30d" ? "active" : ""}">Last 30 days</button>
  </div>

  ${
    data.signedIn
      ? renderSignedIn(data)
      : `<p class="empty">Not signed in. Run "Work Tracker: Sign In" to start tracking.</p>`
  }
  <div class="footer">Queue: ${data.queuedCount} heartbeat(s) pending</div>

<script>
  const vscode = acquireVsCodeApi();
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      vscode.postMessage({ command: 'changeRange', range: btn.dataset.range });
    });
  });
</script>
</body>
</html>`;
}

function renderSignedIn(d: {
  totalSeconds: number;
  linesAdded: number;
  linesRemoved: number;
  byProject: Array<{
    name: string;
    seconds: number;
    color: string;
    linesAdded: number;
    linesRemoved: number;
  }>;
  byLanguage: Array<{ name: string; seconds: number }>;
  byFile: Array<{
    name: string;
    seconds: number;
    language: string;
    linesAdded: number;
    linesRemoved: number;
    sessions: number;
    pct: number;
  }>;
  byDay: Array<{ date: string; seconds: number }>;
  streakDays: number;
  queuedCount: number;
}): string {
  return `
  <div class="cards">
    <div class="card"><div class="label">Total time</div><div class="value">${formatH(d.totalSeconds)}</div></div>
    <div class="card"><div class="label">Streak</div><div class="value">🔥 ${d.streakDays}d</div></div>
    <div class="card"><div class="label">Lines added</div><div class="value">+${d.linesAdded}</div></div>
    <div class="card"><div class="label">Lines removed</div><div class="value">-${d.linesRemoved}</div></div>
  </div>

  <div class="spark">${renderSparkline(d.byDay)}</div>

  <h2>By project</h2>
  ${
    d.byProject.length === 0
      ? `<p class="empty">No data for this range yet.</p>`
      : d.byProject
          .map(
            (p) => `<div class="row">
        <div class="name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct(p.seconds, d.totalSeconds)}%; background:${p.color};"></div></div>
        <div class="value">${formatH(p.seconds)}</div>
      </div>`
          )
          .join("")
  }

  <h2>By language</h2>
  ${
    d.byLanguage.length === 0
      ? `<p class="empty">No data for this range yet.</p>`
      : d.byLanguage
          .map(
            (l) => `<div class="row">
        <div class="name">${escapeHtml(l.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct(l.seconds, d.totalSeconds)}%; background:#5C9EAD;"></div></div>
        <div class="value">${formatH(l.seconds)}</div>
      </div>`
          )
          .join("")
  }

  <h2>By file (top 10)</h2>
  ${
    d.byFile.length === 0
      ? `<p class="empty">No data for this range yet.</p>`
      : `<table class="file-table">
        <thead><tr><th>File</th><th>Language</th><th>Time</th><th>Sessions</th><th>Lines</th><th>Share</th></tr></thead>
        <tbody>${d.byFile
          .slice(0, 10)
          .map(
            (f) => `<tr>
          <td class="file-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</td>
          <td><span class="lang-badge">${escapeHtml(f.language || "text")}</span></td>
          <td>${formatH(f.seconds)}</td>
          <td>${f.sessions}</td>
          <td class="lines"><span class="add">+${f.linesAdded}</span> <span class="del">−${f.linesRemoved}</span></td>
          <td><div class="mini-bar"><div class="mini-fill" style="width:${f.pct.toFixed(1)}%;"></div><span>${f.pct.toFixed(1)}%</span></div></td>
        </tr>`
          )
          .join("")}</tbody>
      </table>`
  }
  `;
}

function renderBars(items: Array<{ name: string; value: number; color: string }>): string {
  return items
    .map(
      (i) => `<div class="row">
        <div class="name">${escapeHtml(i.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct(i.value, totalOf(items))}%; background:${i.color};"></div></div>
        <div class="value">${formatH(i.value)}</div>
      </div>`
    )
    .join("");
}

function totalOf(items: Array<{ value: number }>): number {
  return items.reduce((s, i) => s + i.value, 0);
}

function pct(v: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (v / max) * 100));
}

function formatH(seconds: number): string {
  const s = Math.floor(seconds);
  if (s < 60) {
    return `${s}s`;
  }
  const m = Math.floor(s / 60);
  if (m < 60) {
    return `${m}m`;
  }
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSparkline(days: Array<{ date: string; seconds: number }>): string {
  if (days.length === 0) {
    return "";
  }
  const max = Math.max(...days.map((d) => d.seconds), 1);
  const bars = days
    .map((d) => {
      const h = Math.max(2, (d.seconds / max) * 60);
      return `<div title="${d.date}: ${formatH(d.seconds)}" style="flex:1; height:${h}px; background: var(--vscode-button-background); border-radius: 2px 2px 0 0; align-self:flex-end;"></div>`;
    })
    .join("");
  return `<div style="display:flex; gap:2px; align-items:flex-end; height: 64px; padding: 4px 0;">${bars}</div>`;
}
