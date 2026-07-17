import type { Heartbeat } from "../types";

export interface ReportsInsight {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  textColor: string;
}

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.min(100, Math.max(0, (num / den) * 100));
}

export function getRefactorMode(hbs: Heartbeat[]): ReportsInsight | null {
  if (hbs.length === 0) return null;
  const totalAdded = hbs.reduce((s, h) => s + h.linesAdded, 0);
  const totalRemoved = hbs.reduce((s, h) => s + h.linesRemoved, 0);
  if (totalRemoved <= totalAdded) return null;
  const ratio = pct(totalRemoved, totalAdded + totalRemoved);
  return {
    icon: "🧹",
    title: "Refactor mode",
    value: `${Math.round(ratio)}%`,
    subtitle: `${totalRemoved.toLocaleString()} removed vs ${totalAdded.toLocaleString()} added`,
    gradient: "from-rose-500/10 to-orange-500/5",
    textColor: "text-rose-600 dark:text-rose-400",
  };
}

export function getPolyglotScore(hbs: Heartbeat[]): ReportsInsight | null {
  if (hbs.length === 0) return null;
  const byLang = new Map<string, number>();
  for (const h of hbs) {
    byLang.set(h.language, (byLang.get(h.language) ?? 0) + h.durationSeconds);
  }
  if (byLang.size < 2) return null;
  const total = Array.from(byLang.values()).reduce((s, v) => s + v, 0);
  if (total <= 0) return null;
  let entropy = 0;
  for (const v of byLang.values()) {
    const p = v / total;
    if (p > 0) entropy += -p * Math.log2(p);
  }
  // Normalize against log2(numLangs) to get 0-100
  const max = Math.log2(byLang.size);
  const score = max > 0 ? Math.round((entropy / max) * 100) : 0;
  const label = score >= 80 ? "Polyglot" : score >= 50 ? "Versatile" : "Focused";
  return {
    icon: "🌐",
    title: "Polyglot score",
    value: `${score}`,
    subtitle: `${label} · ${byLang.size} language${byLang.size !== 1 ? "s" : ""}`,
    gradient: "from-sky-500/10 to-blue-500/5",
    textColor: "text-sky-600 dark:text-sky-400",
  };
}

export function getContextSwitching(hbs: Heartbeat[]): ReportsInsight | null {
  if (hbs.length === 0) return null;
  // Group by day, count project switches per day (consecutive different project)
  const byDay = new Map<string, Heartbeat[]>();
  for (const h of hbs) {
    const d = h.timestamp.slice(0, 10);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(h);
  }
  if (byDay.size === 0) return null;
  let totalSwitches = 0;
  for (const sessions of byDay.values()) {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].projectName !== sorted[i - 1].projectName) totalSwitches++;
    }
  }
  const avg = totalSwitches / byDay.size;
  if (avg < 0.5) return null;
  const label =
    avg >= 8 ? "Heavy switcher" : avg >= 4 ? "Frequent" : avg >= 2 ? "Balanced" : "Focused";
  return {
    icon: "🔀",
    title: "Context switching",
    value: avg.toFixed(1),
    subtitle: `${label} · ${totalSwitches} switches over ${byDay.size} day${byDay.size !== 1 ? "s" : ""}`,
    gradient: "from-violet-500/10 to-fuchsia-500/5",
    textColor: "text-violet-600 dark:text-violet-400",
  };
}

export function getLateNightSessions(hbs: Heartbeat[]): ReportsInsight | null {
  if (hbs.length === 0) return null;
  let count = 0;
  let totalSeconds = 0;
  for (const h of hbs) {
    const start = new Date(h.timestamp);
    const end = new Date(start.getTime() + h.durationSeconds * 1000);
    const startHour = start.getHours();
    const endHour = end.getHours();
    if (startHour >= 23 || startHour < 4 || endHour >= 23 || endHour < 4) {
      count++;
      totalSeconds += h.durationSeconds;
    }
  }
  if (count === 0) return null;
  return {
    icon: "🌙",
    title: "Late night sessions",
    value: `${count}`,
    subtitle: `${Math.round(totalSeconds / 60)}m between 11 PM – 4 AM`,
    gradient: "from-indigo-500/10 to-purple-500/5",
    textColor: "text-indigo-600 dark:text-indigo-400",
  };
}

export function getWeekendVsWeekday(hbs: Heartbeat[]): ReportsInsight | null {
  if (hbs.length === 0) return null;
  const byDay = new Map<string, number>();
  for (const h of hbs) {
    const d = h.timestamp.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + h.durationSeconds);
  }
  let weekendSec = 0;
  let weekdaySec = 0;
  let weekendDays = 0;
  let weekdayDays = 0;
  for (const [date, sec] of byDay) {
    const day = new Date(date + "T12:00:00").getDay();
    if (day === 0 || day === 6) {
      weekendSec += sec;
      weekendDays++;
    } else {
      weekdaySec += sec;
      weekdayDays++;
    }
  }
  if (weekendDays === 0 && weekdayDays === 0) return null;
  const weekendAvg = weekendDays > 0 ? weekendSec / weekendDays : 0;
  const weekdayAvg = weekdayDays > 0 ? weekdaySec / weekdayDays : 0;
  if (weekendAvg === 0 && weekdayAvg === 0) return null;
  const isWeekendWarrior = weekendAvg > weekdayAvg;
  const ratio =
    isWeekendWarrior && weekdayAvg > 0
      ? weekendAvg / weekdayAvg
      : !isWeekendWarrior && weekendAvg > 0
        ? weekdayAvg / weekendAvg
        : 0;
  if (ratio < 1.2) return null;
  const label = isWeekendWarrior ? "Weekend warrior" : "Weekday grinder";
  return {
    icon: isWeekendWarrior ? "🏖️" : "💼",
    title: label,
    value: `${ratio.toFixed(1)}x`,
    subtitle: isWeekendWarrior
      ? `Weekends ${Math.round(weekendAvg / 60)}m vs weekdays ${Math.round(weekdayAvg / 60)}m avg`
      : `Weekdays ${Math.round(weekdayAvg / 60)}m vs weekends ${Math.round(weekendAvg / 60)}m avg`,
    gradient: isWeekendWarrior
      ? "from-amber-500/10 to-yellow-500/5"
      : "from-slate-500/10 to-zinc-500/5",
    textColor: isWeekendWarrior
      ? "text-amber-600 dark:text-amber-400"
      : "text-slate-600 dark:text-slate-300",
  };
}

export function getReportsInsights(hbs: Heartbeat[]): ReportsInsight[] {
  const all = [
    getRefactorMode(hbs),
    getPolyglotScore(hbs),
    getContextSwitching(hbs),
    getLateNightSessions(hbs),
    getWeekendVsWeekday(hbs),
  ];
  return all.filter((x): x is ReportsInsight => x !== null);
}
