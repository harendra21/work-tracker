/**
 * Dashboard webview panel.
 */
import * as vscode from "vscode";
import { dashboardHtml } from "./dashboardHtml";
import { HeartbeatServiceImpl } from "../api/heartbeats";
import { Heartbeat } from "../tracker/heartbeat";
import { timezone } from "../util/os";
import { WorkTrackerConfig } from "../config";

type Range = "today" | "7d" | "30d";

export class DashboardPanel {
  private panel: vscode.WebviewPanel | undefined;
  private range: Range = "today";

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly heartbeats: HeartbeatServiceImpl,
    private readonly config: WorkTrackerConfig
  ) {}

  show(): void {
    if (this.panel) {
      this.panel.reveal();
      void this.refresh();
      return;
    }
    this.panel = vscode.window.createWebviewPanel(
      "workTracker.dashboard",
      "Work Tracker Dashboard",
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.command === "changeRange" && typeof msg.range === "string") {
        if (msg.range === "today" || msg.range === "7d" || msg.range === "30d") {
          this.range = msg.range;
          await this.refresh();
        }
      }
    });
    void this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.panel) {
      return;
    }
    const userId = this.config.userId;
    if (!userId) {
      this.panel.webview.html = dashboardHtml(this.emptyState());
      return;
    }
    try {
      const days = this.range === "today" ? 1 : this.range === "7d" ? 7 : 30;
      const recent = await this.heartbeats.fetchRecentHeartbeats(days * 500);
      const filtered = filterByRange(recent, days);
      const tz = timezone();
      const summaries = HeartbeatServiceImpl.aggregate(filtered, tz);
      const totalSeconds = summaries.reduce((s, x) => s + x.totalSeconds, 0);
      const linesAdded = summaries.reduce((s, x) => s + x.linesAdded, 0);
      const linesRemoved = summaries.reduce((s, x) => s + x.linesRemoved, 0);
      const byProject = aggregateBy(summaries, "projectName", "color");
      const byLanguage = aggregateBy(summaries, "language");
      const byFile = aggregateByFile(filtered);
      const byDay = aggregateByDay(summaries);
      const streakDays = computeStreak(byDay);
      const queuedCount = vscode.commands.executeCommand<number>("workTracker.getQueueSize").then(
        (v) => v ?? 0,
        () => 0
      );
      const html = dashboardHtml({
        signedIn: true,
        range: this.range,
        totalSeconds,
        linesAdded,
        linesRemoved,
        byProject: byProject.map((p) => ({
          name: p.name,
          seconds: p.seconds,
          color: p.color ?? "#5C9EAD",
          linesAdded: 0,
          linesRemoved: 0,
        })),
        byLanguage: byLanguage.map((l) => ({ name: l.name, seconds: l.seconds })),
        byFile: byFile.map((f) => ({
          name: f.name,
          seconds: f.seconds,
          language: f.language,
          linesAdded: f.linesAdded,
          linesRemoved: f.linesRemoved,
          sessions: f.sessions,
          pct: f.pct,
        })),
        byDay,
        streakDays,
        queuedCount: await queuedCount,
      });
      this.panel.webview.html = html;
    } catch (err) {
      this.panel.webview.html = dashboardHtml({
        ...this.emptyState(),
        queuedCount: 0,
      });
      void vscode.window.showErrorMessage(
        `Work Tracker: failed to load dashboard (${formatReason(err)})`
      );
    }
  }

  private emptyState() {
    return {
      signedIn: false as const,
      range: this.range,
      totalSeconds: 0,
      linesAdded: 0,
      linesRemoved: 0,
      byProject: [],
      byLanguage: [],
      byFile: [],
      byDay: [],
      streakDays: 0,
      queuedCount: 0,
    };
  }
}

function formatReason(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function filterByRange(hbs: Heartbeat[], days: number): Heartbeat[] {
  if (days === 1) {
    const today = new Date().toISOString().slice(0, 10);
    return hbs.filter((h) => h.timestamp.slice(0, 10) === today);
  }
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return hbs.filter((h) => new Date(h.timestamp).getTime() >= cutoff);
}

function aggregateBy(
  summaries: Array<{
    projectName?: string;
    language?: string;
    totalSeconds: number;
    color?: string;
  }>,
  key: "projectName" | "language",
  colorKey?: "color"
): Array<{ name: string; seconds: number; color?: string }> {
  const map = new Map<string, { seconds: number; color?: string }>();
  for (const s of summaries) {
    const name = (s[key] as string | undefined) ?? "Unknown";
    const existing = map.get(name);
    if (existing) {
      existing.seconds += s.totalSeconds;
    } else {
      map.set(name, { seconds: s.totalSeconds, color: colorKey ? s.color : undefined });
    }
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, seconds: v.seconds, ...(colorKey ? { color: v.color } : {}) }))
    .sort((a, b) => b.seconds - a.seconds);
}

function aggregateByDay(
  summaries: Array<{ date: string; totalSeconds: number }>
): Array<{ date: string; seconds: number }> {
  const map = new Map<string, number>();
  for (const s of summaries) {
    map.set(s.date, (map.get(s.date) ?? 0) + s.totalSeconds);
  }
  return Array.from(map.entries())
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function computeStreak(byDay: Array<{ date: string; seconds: number }>): number {
  if (byDay.length === 0) {
    return 0;
  }
  const days = byDay
    .filter((d) => d.seconds > 0)
    .map((d) => d.date)
    .sort((a, b) => (a < b ? 1 : -1));
  if (days.length === 0) {
    return 0;
  }
  let streak = 0;
  const cursor = new Date(days[0]);
  for (const d of days) {
    if (d === cursor.toISOString().slice(0, 10)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function aggregateByFile(heartbeats: Heartbeat[]): Array<{
  name: string;
  seconds: number;
  language: string;
  linesAdded: number;
  linesRemoved: number;
  sessions: number;
  pct: number;
}> {
  const map = new Map<
    string,
    {
      seconds: number;
      language: string;
      linesAdded: number;
      linesRemoved: number;
      sessions: number;
    }
  >();
  for (const h of heartbeats) {
    const filename = shortFileName(h.entity, h.projectName);
    const existing = map.get(filename);
    if (existing) {
      existing.seconds += h.durationSeconds;
      existing.linesAdded += h.linesAdded;
      existing.linesRemoved += h.linesRemoved;
      existing.sessions += 1;
    } else {
      map.set(filename, {
        seconds: h.durationSeconds,
        language: h.language,
        linesAdded: h.linesAdded,
        linesRemoved: h.linesRemoved,
        sessions: 1,
      });
    }
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v.seconds, 0) || 1;
  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      seconds: v.seconds,
      language: v.language,
      linesAdded: v.linesAdded,
      linesRemoved: v.linesRemoved,
      sessions: v.sessions,
      pct: (v.seconds / total) * 100,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

function shortFileName(entity: string, projectName: string): string {
  if (!entity) return `${projectName}/unknown`;
  const parts = entity.replace(/\\/g, "/").split("/");
  const filename = parts[parts.length - 1] || entity;
  return `${projectName}/${filename}`;
}
