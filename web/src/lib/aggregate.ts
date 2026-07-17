import type {
  Heartbeat,
  AggregatedDay,
  AggregatedItem,
  HourlyHeatmap,
  AggregatedFile,
} from "../types";

export function aggregateByDay(hbs: Heartbeat[]): AggregatedDay[] {
  const map = new Map<string, number>();
  for (const h of hbs) {
    const day = h.timestamp.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + h.durationSeconds);
  }
  return Array.from(map.entries())
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function aggregateByKey(
  hbs: Heartbeat[],
  key: "projectName" | "language" | "entity"
): AggregatedItem[] {
  const map = new Map<string, number>();
  for (const h of hbs) {
    const name = (h[key] as string) || "Unknown";
    map.set(name, (map.get(name) ?? 0) + h.durationSeconds);
  }
  return Array.from(map.entries())
    .map(([name, seconds]) => ({ name, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function aggregateByHourOfWeek(hbs: Heartbeat[]): HourlyHeatmap[] {
  const map = new Map<string, number>();
  for (const h of hbs) {
    const d = new Date(h.timestamp);
    const day = d.getDay();
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    map.set(key, (map.get(key) ?? 0) + h.durationSeconds);
  }
  const result: HourlyHeatmap[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        day,
        hour,
        seconds: map.get(`${day}-${hour}`) ?? 0,
      });
    }
  }
  return result;
}

export function aggregateByFile(hbs: Heartbeat[]): AggregatedFile[] {
  const map = new Map<
    string,
    {
      entity: string;
      projectName: string;
      language: string;
      seconds: number;
      sessions: number;
      linesAdded: number;
      linesRemoved: number;
    }
  >();
  for (const h of hbs) {
    const filename = shortFileName(h.entity, h.projectName);
    const existing = map.get(filename);
    if (existing) {
      existing.seconds += h.durationSeconds;
      existing.sessions += 1;
      existing.linesAdded += h.linesAdded;
      existing.linesRemoved += h.linesRemoved;
    } else {
      map.set(filename, {
        entity: h.entity,
        projectName: h.projectName,
        language: h.language,
        seconds: h.durationSeconds,
        sessions: 1,
        linesAdded: h.linesAdded,
        linesRemoved: h.linesRemoved,
      });
    }
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v.seconds, 0) || 1;
  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      fullPath: v.entity,
      language: v.language,
      seconds: v.seconds,
      sessions: v.sessions,
      linesAdded: v.linesAdded,
      linesRemoved: v.linesRemoved,
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

export function totalSeconds(hbs: Heartbeat[]): number {
  return hbs.reduce((s, h) => s + h.durationSeconds, 0);
}

export function totalLinesAdded(hbs: Heartbeat[]): number {
  return hbs.reduce((s, h) => s + h.linesAdded, 0);
}

export function totalLinesRemoved(hbs: Heartbeat[]): number {
  return hbs.reduce((s, h) => s + h.linesRemoved, 0);
}

export function computeStreak(byDay: AggregatedDay[]): number {
  const active = byDay
    .filter((d) => d.seconds > 0)
    .map((d) => d.date)
    .sort((a, b) => (a < b ? 1 : -1));
  if (active.length === 0) return 0;
  let streak = 0;
  const cursor = new Date(active[0] + "T12:00:00Z");
  for (const d of active) {
    const expected = cursor.toISOString().slice(0, 10);
    if (d === expected) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getRangeStart(range: string, customStart?: string): Date {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "custom" && customStart) {
    return new Date(customStart + "T00:00:00");
  }
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start;
}

export function getTodayStartISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getWeekStartISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function parseList(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export interface GoalProgress {
  actualSeconds: number;
  targetSeconds: number;
  percent: number;
  isHit: boolean;
  remainingSeconds: number;
  windowStartISO: string;
  windowLabel: string;
}

export function computeGoalProgress(
  goal: {
    delta: "day" | "week";
    seconds: number;
    languages?: string;
    projects?: string;
    isEnabled?: boolean;
  },
  hbs: Heartbeat[]
): GoalProgress {
  const windowStartISO = goal.delta === "day" ? getTodayStartISO() : getWeekStartISO();
  const windowStart = new Date(windowStartISO).getTime();
  const langs = parseList(goal.languages);
  const projs = parseList(goal.projects);
  const hasFilter = langs.length > 0 || projs.length > 0;

  let actual = 0;
  for (const h of hbs) {
    const t = new Date(h.timestamp).getTime();
    if (t < windowStart) continue;
    if (langs.length > 0 && !langs.includes(h.language)) continue;
    if (projs.length > 0 && !projs.includes(h.projectName)) continue;
    actual += h.durationSeconds;
  }
  // Suppress unused warning when no filter set
  void hasFilter;

  const target = Math.max(1, goal.seconds);
  const percent = (actual / target) * 100;
  const isHit = goal.isEnabled !== false && actual >= target;
  const remainingSeconds = Math.max(0, target - actual);
  const windowLabel = goal.delta === "day" ? "today" : "this week";

  return {
    actualSeconds: actual,
    targetSeconds: goal.seconds,
    percent,
    isHit,
    remainingSeconds,
    windowStartISO,
    windowLabel,
  };
}
