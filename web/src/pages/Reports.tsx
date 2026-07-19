import { useState, useEffect, useMemo } from "react";
import type { Models } from "appwrite";
import type { Heartbeat, Range } from "../types";
import { fetchHeartbeats } from "../lib/data";
import { getRangeStart } from "../lib/aggregate";
import { formatDuration, shortFilePath } from "../lib/format";
import { getReportsInsights } from "../lib/reportsInsights";
import RangePicker from "../components/RangePicker";
import { Skeleton } from "../components/Skeleton";
import { getUserTimezone } from "../lib/timezone";
import { useSearchParams } from "react-router-dom";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(hbs: Heartbeat[]): Map<string, Heartbeat[]> {
  const map = new Map<string, Heartbeat[]>();
  for (const h of hbs) {
    const date = h.timestamp.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(h);
  }
  return map;
}

function formatDateHeader(date: string): string {
  const d = new Date(date + "T12:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (date === today) return "Today";
  if (date === yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function bestDayInRange(
  grouped: Array<[string, Heartbeat[]]>
): { date: string; seconds: number } | null {
  if (grouped.length === 0) return null;
  return grouped.reduce(
    (best, cur) => {
      const sum = cur[1].reduce((s, h) => s + h.durationSeconds, 0);
      return sum > best.seconds ? { date: cur[0], seconds: sum } : best;
    },
    { date: "", seconds: 0 }
  );
}

interface ProjectStat {
  name: string;
  totalSeconds: number;
  sessions: number;
  added: number;
  removed: number;
}

function topProjects(hbs: Heartbeat[], n = 3): ProjectStat[] {
  const map = new Map<string, ProjectStat>();
  for (const h of hbs) {
    const e = map.get(h.projectName) ?? {
      name: h.projectName,
      totalSeconds: 0,
      sessions: 0,
      added: 0,
      removed: 0,
    };
    e.totalSeconds += h.durationSeconds;
    e.sessions += 1;
    e.added += h.linesAdded;
    e.removed += h.linesRemoved;
    map.set(h.projectName, e);
  }
  return Array.from(map.values())
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, n);
}

export default function Reports({ user }: { user: Models.User<Models.Preferences> }) {
  const [range, setRangeState] = useState<Range>(() => {
    const saved = localStorage.getItem("wt_range_reports");
    return (saved === "today" || saved === "7d" || saved === "30d" || saved === "90d" || saved === "custom" ? saved : "30d") as Range;
  });
  const setRange = (r: Range) => {
    setRangeState(r);
    localStorage.setItem("wt_range_reports", r);
  };
  const [hbs, setHbs] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(true);
  const tz = getUserTimezone(user);
  const [filterProject, setFilterProject] = useState("");
  const [filterLang, setFilterLang] = useState("");
  const [customStart, setCustomStart] = useState(() => localStorage.getItem("wt_custom_start") || "");
  const [customEnd, setCustomEnd] = useState(() => localStorage.getItem("wt_custom_end") || "");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  // Apply filters from query params (set by dashboard chart clicks)
  useEffect(() => {
    const project = searchParams.get("project") ?? "";
    const lang = searchParams.get("lang") ?? "";
    const day = searchParams.get("day") ?? "";
    const dayOfWeek = searchParams.get("dayOfWeek");
    const hour = searchParams.get("hour");
    if (project) setFilterProject(project);
    if (lang) setFilterLang(lang);
    if (day) setExpanded(new Set([day]));
    if (dayOfWeek !== null && hour !== null) {
      setFilterProject("");
      setFilterLang("");
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const since = getRangeStart(range, customStart || undefined, tz);
    fetchHeartbeats(user.$id, since.toISOString())
      .then((rows) => {
        let filtered = rows;
        if (range === "custom" && customEnd) {
          const end = new Date(customEnd + "T23:59:59.999Z").getTime();
          filtered = rows.filter((h) => new Date(h.timestamp).getTime() <= end);
        }
        setHbs(filtered);
      })
      .catch(() => setHbs([]))
      .finally(() => setLoading(false));
  }, [user.$id, range, customStart, customEnd]);

  const projects = useMemo(() => [...new Set(hbs.map((h) => h.projectName))].sort(), [hbs]);
  const languages = useMemo(() => [...new Set(hbs.map((h) => h.language))].sort(), [hbs]);

  const dayOfWeekParam = searchParams.get("dayOfWeek");
  const hourParam = searchParams.get("hour");
  const dayOfWeekNum = dayOfWeekParam !== null ? parseInt(dayOfWeekParam, 10) : null;
  const hourNum = hourParam !== null ? parseInt(hourParam, 10) : null;

  const filtered = useMemo(
    () =>
      hbs.filter((h) => {
        if (filterProject && h.projectName !== filterProject) return false;
        if (filterLang && h.language !== filterLang) return false;
        if (dayOfWeekNum !== null && hourNum !== null) {
          const d = new Date(h.timestamp);
          if (d.getDay() !== dayOfWeekNum || d.getHours() !== hourNum) return false;
        }
        return true;
      }),
    [hbs, filterProject, filterLang, dayOfWeekNum, hourNum]
  );

  const clearUrlFilters = () => {
    setSearchParams({});
  };

  const hasUrlFilter = searchParams.toString().length > 0;

  const grouped = useMemo(() => {
    const g = groupByDate(filtered);
    return Array.from(g.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const totalSeconds = filtered.reduce((s, h) => s + h.durationSeconds, 0);
  const totalAdded = filtered.reduce((s, h) => s + h.linesAdded, 0);
  const totalRemoved = filtered.reduce((s, h) => s + h.linesRemoved, 0);
  const uniqueFiles = new Set(filtered.map((h) => h.entity)).size;
  const uniqueProjects = new Set(filtered.map((h) => h.projectName)).size;
  const uniqueLanguages = new Set(filtered.map((h) => h.language)).size;
  const bestDay = bestDayInRange(grouped);
  const avgPerSession = filtered.length > 0 ? totalSeconds / filtered.length : 0;
  const topProjs = topProjects(filtered, 3);
  const reportsInsights = getReportsInsights(filtered);

  // Editing pattern: read vs write ratio
  const writeSessions = filtered.filter((h) => h.isWrite).length;
  const readSessions = filtered.length - writeSessions;
  const writeRatio = filtered.length > 0 ? (writeSessions / filtered.length) * 100 : 0;

  // Longest session in range
  const sortedHb = [...filtered].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let longestSession = 0;
  let longestSessionDate = "";
  let cur = 0;
  let prevEnd = 0;
  let curStartDate = "";
  for (const h of sortedHb) {
    const start = new Date(h.timestamp).getTime() / 1000;
    if (start - prevEnd < 300) {
      cur += h.durationSeconds;
    } else {
      cur = h.durationSeconds;
      curStartDate = h.timestamp.slice(0, 10);
    }
    if (cur > longestSession) {
      longestSession = cur;
      longestSessionDate = curStartDate;
    }
    prevEnd = start + h.durationSeconds;
  }

  // Most active hour
  const byHour = new Map<number, number>();
  for (const h of filtered) {
    const hr = new Date(h.timestamp).getHours();
    byHour.set(hr, (byHour.get(hr) ?? 0) + h.durationSeconds);
  }
  let peakHour = -1;
  let peakHourSeconds = 0;
  for (const [h, v] of byHour) {
    if (v > peakHourSeconds) {
      peakHour = h;
      peakHourSeconds = v;
    }
  }
  const peakHour12 =
    peakHour < 0
      ? ""
      : peakHour === 0
        ? "12 AM"
        : peakHour < 12
          ? `${peakHour} AM`
          : peakHour === 12
            ? "12 PM"
            : `${peakHour - 12} PM`;

  // Active days
  const activeDays = new Set(filtered.map((h) => h.timestamp.slice(0, 10))).size;
  const totalDays = grouped.length || 1;
  const activeDayRatio = (activeDays / totalDays) * 100;

  const toggleGroup = (date: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const expandAll = () => {
    if (expanded.size === grouped.length) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(grouped.map(([d]) => d)));
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 sm:p-6 text-white shadow-lg animate-fade-in">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="text-white/80 text-xs sm:text-sm">📋 Detailed breakdown</div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Reports</h1>
            <p className="text-white/90 mt-1 text-xs sm:text-sm">
              Every session, every keystroke, every line — all in one place.
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/20">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
              Total
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5">
              {formatDuration(totalSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Range picker */}
      <div className="flex justify-end">
        <RangePicker value={range} onChange={setRange} customStart={customStart} customEnd={customEnd} onCustomStartChange={(d) => { setCustomStart(d); localStorage.setItem("wt_custom_start", d); }} onCustomEndChange={(d) => { setCustomEnd(d); localStorage.setItem("wt_custom_end", d); }} />
      </div>

      {/* Key insights row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Avg / session
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">{formatDuration(avgPerSession)}</div>
          <div className="text-[11px] text-gray-500 mt-1">Across {filtered.length} sessions</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Best day
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">
            {bestDay && bestDay.seconds > 0 ? formatDuration(bestDay.seconds) : "—"}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {bestDay && bestDay.seconds > 0 ? formatDateHeader(bestDay.date) : "No data yet"}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Write / Read
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">{writeRatio.toFixed(0)}%</div>
          <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
              style={{ width: `${writeRatio}%` }}
            />
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            Net lines
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">
            <span
              className={
                totalAdded - totalRemoved >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }
            >
              {totalAdded - totalRemoved >= 0 ? "+" : ""}
              {totalAdded - totalRemoved}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            <span className="text-emerald-600">+{totalAdded}</span>
            <span className="mx-1">/</span>
            <span className="text-red-500">−{totalRemoved}</span>
          </div>
        </div>
      </div>

      {/* Top projects insight */}
      {topProjs.length > 0 && totalSeconds > 0 && (
        <div className="card p-4 animate-slide-up" style={{ animationDelay: "25ms" }}>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              🏆 Top projects
            </h3>
            <span className="text-xs text-gray-500">{topProjs.length} highlighted</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topProjs.map((p, i) => {
              const pct = totalSeconds > 0 ? (p.totalSeconds / totalSeconds) * 100 : 0;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={p.name}
                  className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/50 hover:scale-[1.02] transition-transform"
                >
                  <div className="absolute top-2 right-2 text-2xl opacity-30">{medals[i]}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    #{i + 1}
                  </div>
                  <div className="font-semibold text-sm mt-1 truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div className="text-lg font-bold text-brand tabular-nums mt-1">
                    {formatDuration(p.totalSeconds)}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {p.sessions} session{p.sessions !== 1 ? "s" : ""} · {pct.toFixed(0)}%
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand to-teal-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-2 tabular-nums">
                    <span className="text-emerald-600">+{p.added}</span>
                    <span>/</span>
                    <span className="text-red-500">−{p.removed}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editing patterns */}
      {filtered.length > 0 && (
        <div className="card p-4 animate-slide-up" style={{ animationDelay: "40ms" }}>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              🎯 Editing patterns
            </h3>
            <span className="text-xs text-gray-500">
              {activeDays}/{totalDays} day{totalDays !== 1 ? "s" : ""} active
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Longest session
              </div>
              <div className="text-lg font-bold mt-1 tabular-nums text-violet-600 dark:text-violet-400">
                {longestSession > 0 ? formatDuration(longestSession) : "—"}
              </div>
              {longestSessionDate && (
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {formatDateHeader(longestSessionDate)}
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Peak hour
              </div>
              <div className="text-lg font-bold mt-1 tabular-nums text-amber-600 dark:text-amber-400">
                {peakHour12 || "—"}
              </div>
              {peakHourSeconds > 0 && (
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {Math.round(peakHourSeconds / 60)}m that hour
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Write sessions
              </div>
              <div className="text-lg font-bold mt-1 tabular-nums text-emerald-600 dark:text-emerald-400">
                {writeSessions}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {readSessions} read · {writeRatio.toFixed(0)}% write
              </div>
              <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
                  style={{ width: `${writeRatio}%` }}
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Active days
              </div>
              <div className="text-lg font-bold mt-1 tabular-nums text-blue-600 dark:text-blue-400">
                {activeDays}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {activeDayRatio.toFixed(0)}% of range
              </div>
              <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, activeDayRatio)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-3 animate-slide-up">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="input max-w-[200px]"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="input max-w-[200px]"
        >
          <option value="">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {hasUrlFilter && (
          <button
            onClick={clearUrlFilters}
            className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:opacity-80 transition-opacity"
            title="Clear filters from URL"
          >
            🔗 linked filter · clear
          </button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-gray-500">
          {filtered.length} sessions · {formatDuration(totalSeconds)} · {uniqueProjects} project(s)
          · {uniqueLanguages} language(s) · {uniqueFiles} file(s)
        </span>
        {grouped.length > 0 && (
          <button onClick={expandAll} className="btn-secondary text-xs">
            {expanded.size === grouped.length ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {/* New reports insights */}
      {reportsInsights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 animate-slide-up">
          {reportsInsights.map((ins) => (
            <div
              key={ins.title}
              className={`card p-4 bg-gradient-to-br ${ins.gradient} hover:-translate-y-0.5 transition-transform`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{ins.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {ins.title}
                </span>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${ins.textColor}`}>{ins.value}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {ins.subtitle}
              </div>
            </div>
          ))}
        </div>
      )}



      {loading ? (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-500 dark:text-gray-400">No sessions found for this range.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, sessions], idx) => {
            const dayTotal = sessions.reduce((s, h) => s + h.durationSeconds, 0);
            const dayAdded = sessions.reduce((s, h) => s + h.linesAdded, 0);
            const dayRemoved = sessions.reduce((s, h) => s + h.linesRemoved, 0);
            const dayFiles = new Set(sessions.map((h) => h.entity)).size;
            const dayWrite = sessions.filter((h) => h.isWrite).length;
            const isOpen = expanded.has(date);
            const isBest = bestDay?.date === date;
            return (
              <div
                key={date}
                className={`card overflow-hidden animate-slide-up ${
                  isBest ? "ring-2 ring-warm/40" : ""
                }`}
                style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
              >
                <button
                  onClick={() => toggleGroup(date)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left"
                >
                  <span
                    className={`text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{formatDateHeader(date)}</span>
                      {isBest && (
                        <span className="badge bg-warm/20 text-warm dark:bg-warm/30">
                          🏆 Best day
                        </span>
                      )}
                      {dayWrite > 0 && (
                        <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                          {dayWrite} write
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {dayFiles} file
                      {dayFiles !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand tabular-nums text-lg">
                      {formatDuration(dayTotal)}
                    </div>
                    <div className="text-xs mt-0.5 flex items-center gap-1 justify-end">
                      {dayAdded > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">+{dayAdded}</span>
                      )}
                      {dayRemoved > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">/</span>
                          <span className="text-red-500 dark:text-red-400">−{dayRemoved}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50/50 to-white/0 dark:from-gray-900/30 dark:to-gray-800/0 divide-y divide-gray-200/70 dark:divide-gray-700/50">
                    {sessions.map((h) => (
                      <div
                        key={h.$id}
                        className="p-3 hover:bg-white dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-[10px] tabular-nums text-gray-400 mt-0.5 w-20 flex-shrink-0">
                            {formatTime(h.timestamp)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-medium font-mono truncate"
                              title={h.entity}
                            >
                              {shortFilePath(h.entity, h.projectName)}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: "var(--brand, #5C9EAD)" }}
                              />
                              <span>{h.projectName}</span>
                              <span>·</span>
                              <span className="badge bg-brand/10 text-brand">{h.language}</span>
                              {h.branch && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-[11px]">{h.branch}</span>
                                </>
                              )}
                              {h.isWrite && (
                                <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  ✏️ write
                                </span>
                              )}
                              {h.category && h.category !== "coding" && (
                                <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                  {h.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold tabular-nums">
                              {formatDuration(h.durationSeconds)}
                            </div>
                            {(h.linesAdded > 0 || h.linesRemoved > 0) && (
                              <div className="text-[11px] tabular-nums mt-0.5">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{h.linesAdded}
                                </span>
                                <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                                <span className="text-red-500 dark:text-red-400">
                                  −{h.linesRemoved}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
