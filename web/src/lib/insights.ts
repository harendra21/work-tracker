import type { Heartbeat } from "../types";

export interface Insight {
  icon: string;
  title: string;
  description: string;
  color: string;
  priority?: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function findLongestStreak(hbs: Heartbeat[]): number {
  if (hbs.length === 0) return 0;
  const days = new Set(hbs.map((h) => h.timestamp.slice(0, 10)));
  const sorted = Array.from(days).sort();
  let longest = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const dt = new Date(d + "T12:00:00");
    if (prev && dt.getTime() - prev.getTime() === 86400000) {
      cur++;
    } else {
      cur = 1;
    }
    longest = Math.max(longest, cur);
    prev = dt;
  }
  return longest;
}

export function generateInsights(hbs: Heartbeat[], streak: number): Insight[] {
  const insights: Insight[] = [];

  if (hbs.length === 0) {
    return [
      {
        icon: "✨",
        title: "Ready to start?",
        description: "Open a file in VS Code to begin tracking your coding time.",
        color: "from-brand/10 to-teal-500/10",
        priority: 1,
      },
    ];
  }

  const total = hbs.reduce((s, h) => s + h.durationSeconds, 0);
  const added = hbs.reduce((s, h) => s + h.linesAdded, 0);
  const removed = hbs.reduce((s, h) => s + h.linesRemoved, 0);

  // Languages map (used by several insights)
  const byLanguage = new Map<string, number>();
  for (const h of hbs) {
    byLanguage.set(h.language, (byLanguage.get(h.language) ?? 0) + h.durationSeconds);
  }
  const net = added - removed;

  // ── Most productive day of week ──
  const byDayOfWeek = new Map<number, number>();
  for (const h of hbs) {
    const d = new Date(h.timestamp).getDay();
    byDayOfWeek.set(d, (byDayOfWeek.get(d) ?? 0) + h.durationSeconds);
  }
  if (byDayOfWeek.size > 0) {
    const topDay = Array.from(byDayOfWeek.entries()).sort((a, b) => b[1] - a[1])[0];
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      topDay[0]
    ];
    const pct = total > 0 ? ((topDay[1] / total) * 100).toFixed(0) : 0;
    if (Number(pct) >= 15) {
      insights.push({
        icon: "📅",
        title: `${dayName} is your day`,
        description: `You're most productive on ${dayName}s — ${pct}% of your coding time happens then.`,
        color: "from-purple-500/10 to-pink-500/10",
        priority: 3,
      });
    }
  }

  // ── Most productive hour ──
  const byHour = new Map<number, number>();
  for (const h of hbs) {
    const hr = new Date(h.timestamp).getHours();
    byHour.set(hr, (byHour.get(hr) ?? 0) + h.durationSeconds);
  }
  if (byHour.size > 0) {
    const topHour = Array.from(byHour.entries()).sort((a, b) => b[1] - a[1])[0];
    const h12 = topHour[0] === 0 ? 12 : topHour[0] > 12 ? topHour[0] - 12 : topHour[0];
    const ampm = topHour[0] < 12 ? "AM" : "PM";
    insights.push({
      icon: "⏰",
      title: `Peak focus: ${h12} ${ampm}`,
      description: `Your sharpest hours are around ${h12} ${ampm}. Schedule deep work then.`,
      color: "from-amber-500/10 to-orange-500/10",
      priority: 3,
    });
  }

  // ── Longest session (focus) ──
  const sorted = [...hbs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let longest = 0;
  let cur = 0;
  let prevEnd = 0;
  for (const h of sorted) {
    const start = new Date(h.timestamp).getTime() / 1000;
    const end = start + h.durationSeconds;
    if (start - prevEnd < 300) cur += h.durationSeconds;
    else cur = h.durationSeconds;
    longest = Math.max(longest, cur);
    prevEnd = end;
  }
  if (longest > 1800) {
    const mins = Math.round(longest / 60);
    const qual =
      mins >= 120 ? "Incredible" : mins >= 60 ? "Strong" : mins >= 30 ? "Solid" : "Building";
    insights.push({
      icon: "🎯",
      title: `${qual} focus: ${mins}m`,
      description: `Your longest uninterrupted session was ${mins} minutes. Deep work pays off.`,
      color: "from-emerald-500/10 to-green-500/10",
      priority: 2,
    });
  }

  // ── Code velocity ──
  const ratio = removed > 0 ? (added / removed).toFixed(1) : added > 0 ? "∞" : "0";
  if (added + removed > 50) {
    insights.push({
      icon: "📊",
      title: `Code velocity: +${added}/−${removed}`,
      description: `Your add/remove ratio is ${ratio}. ${net > 0 ? "Net positive growth" : "Heavy refactor mode"}.`,
      color: "from-blue-500/10 to-cyan-500/10",
      priority: 4,
    });
  }

  // ── Streak ──
  if (streak >= 7) {
    insights.push({
      icon: "🔥",
      title: `${streak}-day streak!`,
      description: `Consistency compounds. ${streak} days in a row — keep the chain alive.`,
      color: "from-red-500/10 to-orange-500/10",
      priority: 1,
    });
  } else if (streak >= 3) {
    insights.push({
      icon: "🔥",
      title: `${streak}-day streak`,
      description: `Building momentum. ${7 - streak} more day(s) for a full week.`,
      color: "from-orange-500/10 to-amber-500/10",
      priority: 1,
    });
  }

  // ── Project variety ──
  const projects = new Set(hbs.map((h) => h.projectName));
  if (projects.size >= 3) {
    insights.push({
      icon: "🧩",
      title: `${projects.size} active projects`,
      description: `You're juggling ${projects.size} projects. Consider focusing on one for deeper progress.`,
      color: "from-indigo-500/10 to-violet-500/10",
      priority: 5,
    });
  }

  // ── Average session length ──
  const avgSession = total / hbs.length;
  if (hbs.length >= 5) {
    const mins = Math.round(avgSession / 60);
    insights.push({
      icon: "⏳",
      title: `Avg session: ${mins}m`,
      description: `Your average coding session lasts ${mins} minutes. ${mins >= 25 ? "Great for deep work!" : "Try longer uninterrupted blocks."}`,
      color: "from-cyan-500/10 to-blue-500/10",
      priority: 5,
    });
  }

  // ── Weekend vs weekday ──
  const weekend = Array.from(byDayOfWeek.entries())
    .filter(([d]) => d === 0 || d === 6)
    .reduce((s, [, v]) => s + v, 0);
  const weekday = total - weekend;
  if (weekend > 0 && weekday > 0) {
    const wp = ((weekend / total) * 100).toFixed(0);
    insights.push({
      icon: Number(wp) >= 30 ? "🌅" : "💼",
      title: `${wp}% on weekends`,
      description:
        Number(wp) >= 30
          ? `You're a weekend warrior! ${wp}% of your coding happens Sat/Sun.`
          : `Mostly weekday coder — only ${wp}% of time on weekends.`,
      color: "from-pink-500/10 to-rose-500/10",
      priority: 6,
    });
  }

  // ── Early bird / night owl ──
  const morning =
    (byHour.get(5) ?? 0) +
    (byHour.get(6) ?? 0) +
    (byHour.get(7) ?? 0) +
    (byHour.get(8) ?? 0) +
    (byHour.get(9) ?? 0) +
    (byHour.get(10) ?? 0) +
    (byHour.get(11) ?? 0);
  const night =
    (byHour.get(22) ?? 0) +
    (byHour.get(23) ?? 0) +
    (byHour.get(0) ?? 0) +
    (byHour.get(1) ?? 0) +
    (byHour.get(2) ?? 0) +
    (byHour.get(3) ?? 0) +
    (byHour.get(4) ?? 0);
  if (morning > night * 2 && morning > 1800) {
    insights.push({
      icon: "🐦",
      title: "Early bird coder",
      description: "You do most of your work in the morning hours. The early code catches the bug.",
      color: "from-yellow-500/10 to-amber-500/10",
      priority: 7,
    });
  } else if (night > morning * 2 && night > 1800) {
    insights.push({
      icon: "🦉",
      title: "Night owl",
      description: "Your best work happens after dark. The quiet hours suit you well.",
      color: "from-indigo-500/10 to-purple-500/10",
      priority: 7,
    });
  }

  // ── Longest streak ever ──
  const allTime = findLongestStreak(hbs);
  if (allTime > streak && allTime >= 14) {
    insights.push({
      icon: "⚡",
      title: `Best streak: ${allTime} days`,
      description: `Your personal best was ${allTime} consecutive days. Time to beat it?`,
      color: "from-violet-500/10 to-fuchsia-500/10",
      priority: 4,
    });
  }

  // ── Most-edited file ──
  const byFile = new Map<string, { seconds: number; visits: number }>();
  for (const h of hbs) {
    const key = h.entity.split(/[\\/]/).pop() || h.entity;
    const e = byFile.get(key) ?? { seconds: 0, visits: 0 };
    e.seconds += h.durationSeconds;
    e.visits += 1;
    byFile.set(key, e);
  }
  if (byFile.size > 0) {
    const topFile = Array.from(byFile.entries()).sort((a, b) => b[1].visits - a[1].visits)[0];
    if (topFile[1].visits >= 5) {
      insights.push({
        icon: "📌",
        title: `Hot file: ${topFile[0]}`,
        description: `You've touched ${topFile[0]} ${topFile[1].visits} times. Core of your work?`,
        color: "from-rose-500/10 to-pink-500/10",
        priority: 6,
      });
    }
  }

  // ── Languages used ──
  if (byLanguage.size >= 3) {
    const top = Array.from(byLanguage.entries()).sort((a, b) => b[1] - a[1])[0];
    const second = Array.from(byLanguage.entries()).sort((a, b) => b[1] - a[1])[1];
    if (top && second) {
      const topPct = ((top[1] / total) * 100).toFixed(0);
      insights.push({
        icon: "🌐",
        title: `Polyglot: ${byLanguage.size} languages`,
        description: `Top pair: ${top[0]} (${topPct}%) and ${second[0]}. Language-agnostic coder.`,
        color: "from-teal-500/10 to-emerald-500/10",
        priority: 7,
      });
    }
  }

  // ── Today's pace ──
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySeconds = hbs
    .filter((h) => h.timestamp.slice(0, 10) === todayIso)
    .reduce((s, h) => s + h.durationSeconds, 0);
  const now = new Date();
  const hourOfDay = now.getHours() || 1;
  const expectedPace =
    (total / hbs.length) * hbs.filter((h) => h.timestamp.slice(0, 10) === todayIso).length;
  if (todaySeconds > 0 && hourOfDay > 4) {
    const mins = Math.round(todaySeconds / 60);
    insights.push({
      icon: mins >= 120 ? "🚀" : mins >= 60 ? "✈️" : "🐢",
      title: `Today: ${mins}m logged`,
      description:
        mins >= 180
          ? "Marathon day! Don't forget to take breaks."
          : mins >= 60
            ? "Solid session today. Keep the momentum."
            : "Getting warmed up. Make it count.",
      color: "from-green-500/10 to-teal-500/10",
      priority: 1,
    });
  }

  // ── Branch diversity ──
  const branches = new Set(
    hbs.map((h) => h.branch).filter((b) => b && b !== "main" && b !== "master")
  );
  if (branches.size >= 3) {
    insights.push({
      icon: "🌿",
      title: `${branches.size} feature branches`,
      description: `Active across ${branches.size} branches. Good parallel exploration.`,
      color: "from-lime-500/10 to-green-500/10",
      priority: 8,
    });
  }

  // ── Largest single change ──
  const biggestAdd = Math.max(0, ...hbs.map((h) => h.linesAdded));
  if (biggestAdd >= 100) {
    insights.push({
      icon: "💥",
      title: `Biggest change: +${biggestAdd} lines`,
      description: `Your most productive single edit added ${biggestAdd} lines. Bold move.`,
      color: "from-orange-500/10 to-red-500/10",
      priority: 7,
    });
  }

  // ── Consistency over last N days ──
  const last14 = new Set<string>();
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last14.add(d.toISOString().slice(0, 10));
  }
  const activeRecent = new Set(
    hbs.filter((h) => last14.has(h.timestamp.slice(0, 10))).map((h) => h.timestamp.slice(0, 10))
  );
  if (activeRecent.size >= 10) {
    insights.push({
      icon: "📆",
      title: `${activeRecent.size}/14 days active`,
      description: `You've been active ${activeRecent.size} of the last 14 days. ${activeRecent.size >= 14 ? "Perfect attendance!" : "Solid consistency."}`,
      color: "from-emerald-500/10 to-green-500/10",
      priority: 2,
    });
  } else if (activeRecent.size >= 5) {
    insights.push({
      icon: "📆",
      title: `${activeRecent.size}/14 days active`,
      description: `Active ${activeRecent.size} of last 14 days. ${14 - activeRecent.size} days off — consider showing up more.`,
      color: "from-amber-500/10 to-yellow-500/10",
      priority: 2,
    });
  }

  // ── Refactor mode detection ──
  if (removed > added * 1.5 && removed > 100) {
    insights.push({
      icon: "🧹",
      title: "Refactor mode",
      description: `Removed ${removed} lines vs added ${added}. Cleaning up the codebase.`,
      color: "from-pink-500/10 to-rose-500/10",
      priority: 6,
    });
  }

  // ── Average lines per session ──
  if (hbs.length >= 5) {
    const avgLines = Math.round(added / hbs.length);
    if (avgLines >= 20) {
      insights.push({
        icon: "⚡",
        title: `${avgLines} lines/session avg`,
        description: `High throughput — ${avgLines} lines added per session on average.`,
        color: "from-cyan-500/10 to-blue-500/10",
        priority: 8,
      });
    }
  }

  // ── Single-day volume ──
  if (byDayOfWeek.size > 0) {
    const dailyTotals = new Map<string, number>();
    for (const h of hbs) {
      const d = h.timestamp.slice(0, 10);
      dailyTotals.set(d, (dailyTotals.get(d) ?? 0) + h.durationSeconds);
    }
    const topDay = Array.from(dailyTotals.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topDay[1] >= 14400) {
      // 4+ hours in a single day
      const hrs = Math.round(topDay[1] / 3600);
      insights.push({
        icon: "🏆",
        title: `Personal best: ${hrs}h in a day`,
        description: `Your most productive single day was ${hrs} hours of coding. ${formatDateLabel(topDay[0])}.`,
        color: "from-yellow-500/10 to-amber-500/10",
        priority: 4,
      });
    }
  }

  // ── File extension diversity ──
  const extensions = new Set(
    hbs.map((h) => {
      const m = h.entity.match(/\.([a-zA-Z0-9]+)$/);
      return m ? m[1].toLowerCase() : "other";
    })
  );
  if (extensions.size >= 5) {
    insights.push({
      icon: "🗂️",
      title: `${extensions.size} file types`,
      description: `Working across ${extensions.size} file extensions. Multi-stack work.`,
      color: "from-slate-500/10 to-gray-500/10",
      priority: 9,
    });
  }

  // Sort by priority and return top 6
  return insights.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)).slice(0, 6);
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function computeFocusScore(hbs: Heartbeat[]): number {
  if (hbs.length === 0) return 0;
  const sorted = [...hbs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let longest = 0;
  let cur = 0;
  let prevEnd = 0;
  for (const h of sorted) {
    const start = new Date(h.timestamp).getTime() / 1000;
    if (start - prevEnd < 300) cur += h.durationSeconds;
    else cur = h.durationSeconds;
    longest = Math.max(longest, cur);
    prevEnd = start + h.durationSeconds;
  }
  return Math.min(100, Math.round((longest / 7200) * 100));
}

export function computeProductivityScore(hbs: Heartbeat[]): number {
  // Composite: 40% consistency (active days / total days), 30% focus (longest session), 30% volume
  if (hbs.length === 0) return 0;
  const total = hbs.reduce((s, h) => s + h.durationSeconds, 0);
  const days = new Set(hbs.map((h) => h.timestamp.slice(0, 10))).size;
  const sorted = [...hbs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let longest = 0;
  let cur = 0;
  let prevEnd = 0;
  for (const h of sorted) {
    const start = new Date(h.timestamp).getTime() / 1000;
    if (start - prevEnd < 300) cur += h.durationSeconds;
    else cur = h.durationSeconds;
    longest = Math.max(longest, cur);
    prevEnd = start + h.durationSeconds;
  }
  // Heuristic: assume ~14 day window max for consistency
  const consistency = Math.min(1, days / 14);
  const focus = Math.min(1, longest / 7200);
  const volume = Math.min(1, total / 36000); // 10h target
  return Math.round((consistency * 0.4 + focus * 0.3 + volume * 0.3) * 100);
}

export function compareToPrevious(): {
  timeChange: number;
  addedChange: number;
  sessionsChange: number;
} {
  // Simple: just return zeros for now
  return { timeChange: 0, addedChange: 0, sessionsChange: 0 };
}
