/**
 * Goals webview panel.
 */
import * as vscode from "vscode";
import { GoalService, Goal } from "../api/goals";

export class GoalsPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly goals: GoalService
  ) {}

  show(): void {
    if (this.panel) {
      this.panel.reveal();
      void this.refresh();
      return;
    }
    this.panel = vscode.window.createWebviewPanel(
      "workTracker.goals",
      "Work Tracker Goals",
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.command === "create") {
        await this.create(msg);
        await this.refresh();
      } else if (msg?.command === "delete" && typeof msg.id === "string") {
        await this.goals.delete(msg.id).catch(() => undefined);
        await this.refresh();
      } else if (msg?.command === "toggle" && typeof msg.id === "string") {
        const list = await this.goals.list();
        const g = list.find((x) => x.$id === msg.id);
        if (g) {
          await this.goals.update(g.$id, { isEnabled: !g.isEnabled }).catch(() => undefined);
        }
        await this.refresh();
      }
    });
    void this.refresh();
  }

  private async create(input: {
    title: string;
    delta: "day" | "week";
    seconds: number;
    languages: string[];
    projects: string[];
  }): Promise<void> {
    await this.goals.create({
      title: input.title,
      delta: input.delta,
      seconds: input.seconds,
      languages: input.languages,
      projects: input.projects,
      isEnabled: true,
    });
  }

  async refresh(): Promise<void> {
    if (!this.panel) {
      return;
    }
    const list = await this.goals.list().catch(() => [] as Goal[]);
    this.panel.webview.html = this.html(list);
  }

  private html(list: Goal[]): string {
    const rows =
      list.length === 0
        ? `<p style="opacity:0.6;font-style:italic">No goals yet. Add one below.</p>`
        : list
            .map(
              (g) => `<tr>
              <td>${escape(g.title)}</td>
              <td>${g.delta}</td>
              <td>${(g.seconds / 3600).toFixed(2)} h</td>
              <td>${(g.languages ?? []).join(", ")}</td>
              <td>${(g.projects ?? []).join(", ")}</td>
              <td>${g.isEnabled ? "✅" : "⏸"}</td>
              <td>
                <button data-id="${g.$id}" data-cmd="toggle">Toggle</button>
                <button data-id="${g.$id}" data-cmd="delete">Delete</button>
              </td>
            </tr>`
            )
            .join("");
    return /* html */ `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border-bottom: 1px solid var(--vscode-editorWidget-border); text-align: left; }
  form { margin-top: 16px; padding: 8px; border: 1px solid var(--vscode-editorWidget-border); border-radius: 4px; }
  form input, form select { margin: 4px 8px 4px 0; padding: 3px 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
  form button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px 12px; cursor: pointer; }
</style>
</head>
<body>
  <h1>Goals</h1>
  <table>
    <thead><tr><th>Title</th><th>Delta</th><th>Hours</th><th>Languages</th><th>Projects</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <form id="new-goal">
    <h3>New goal</h3>
    <input name="title" placeholder="Title (e.g. Daily 2 hours)" required />
    <select name="delta">
      <option value="day">per day</option>
      <option value="week">per week</option>
    </select>
    <input name="hours" type="number" min="0.25" step="0.25" placeholder="Hours" required />
    <input name="languages" placeholder="Languages (comma)" />
    <input name="projects" placeholder="Projects (comma)" />
    <button type="submit">Add</button>
  </form>
<script>
  const vscode = acquireVsCodeApi();
  document.querySelectorAll('button[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      vscode.postMessage({ command: btn.dataset.cmd, id: btn.dataset.id });
    });
  });
  document.getElementById('new-goal').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    vscode.postMessage({
      command: 'create',
      title: fd.get('title'),
      delta: fd.get('delta'),
      seconds: Math.round(parseFloat(fd.get('hours')) * 3600),
      languages: (fd.get('languages') || '').toString().split(',').map(s => s.trim()).filter(Boolean),
      projects: (fd.get('projects') || '').toString().split(',').map(s => s.trim()).filter(Boolean),
    });
    e.target.reset();
  });
</script>
</body>
</html>`;
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
