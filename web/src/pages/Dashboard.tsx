import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Models } from "appwrite";
import type { Heartbeat, Project, Range } from "../types";
import { fetchHeartbeats, fetchProjects, toggleProjectTracking } from "../lib/data";
import {
  getRangeStart,
  aggregateByDay,
  aggregateByKey,
  aggregateByHourOfWeek,
  aggregateByFile,
  totalSeconds,
  totalLinesAdded,
  totalLinesRemoved,
  computeStreak,
} from "../lib/aggregate";
import { formatDuration } from "../lib/format";
import RangePicker from "../components/RangePicker";
import StatCard from "../components/StatCard";
import TrendChart from "../components/TrendChart";
import Heatmap from "../components/Heatmap";
import FileTable from "../components/FileTable";
import DonutChart from "../components/DonutChart";
import FocusRing from "../components/FocusRing";
import ScrollReveal from "../components/ScrollReveal";
import Insights from "../components/Insights";
import Timeline from "../components/Timeline";
import WeekStrip from "../components/WeekStrip";
import ProductivityRing from "../components/ProductivityRing";
import DayOfWeekChart from "../components/DayOfWeekChart";
import { computeFocusScore, computeProductivityScore, generateInsights } from "../lib/insights";
import { Skeleton, SkeletonRings, SkeletonChart, SkeletonTable } from "../components/Skeleton";
import { getUserTimezone } from "../lib/timezone";
import { useNavigate } from "react-router-dom";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 5) return "🌙";
  if (h < 12) return "☀️";
  if (h < 18) return "👋";
  return "🌆";
}

export default function Dashboard({ user }: { user: Models.User<Models.Preferences> }) {
  const navigate = useNavigate();
  const [range, setRangeState] = useState<Range>(() => {
    const saved = localStorage.getItem("wt_range_dashboard");
    return (saved === "today" || saved === "7d" || saved === "30d" || saved === "90d" || saved === "custom" ? saved : "7d") as Range;
  });
  const setRange = (r: Range) => {
    setRangeState(r);
    localStorage.setItem("wt_range_dashboard", r);
  };

  const [hbs, setHbs] = useState<Heartbeat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const tz = getUserTimezone(user);
  const [customStart, setCustomStart] = useState(() => localStorage.getItem("wt_custom_start_dash") || "");
  const [customEnd, setCustomEnd] = useState(() => localStorage.getItem("wt_custom_end_dash") || "");

  useEffect(() => {
    setLoading(true);
    const since = getRangeStart(range, customStart || undefined, tz);
    let prom = fetchHeartbeats(user.$id, since.toISOString());
    if (range === "custom" && customEnd) {
      const end = new Date(customEnd + "T23:59:59").getTime();
      prom = prom.then((rows) => rows.filter((h) => new Date(h.timestamp).getTime() <= end));
    }
    Promise.all([prom, fetchProjects(user.$id)])
      .then(([h, p]) => {
        setHbs(h);
        setProjects(p as unknown as Project[]);
      })
      .catch(() => {
        setHbs([]);
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, [user.$id, range, customStart, customEnd]);

  const byDay = aggregateByDay(hbs);
  const byProject = aggregateByKey(hbs, "projectName");
  const byLanguage = aggregateByKey(hbs, "language");
  const byFile = aggregateByFile(hbs);
  const heatmap = aggregateByHourOfWeek(hbs);
  const total = totalSeconds(hbs);
  const streak = computeStreak(byDay);
  const linesAdded = totalLinesAdded(hbs);
  const linesRemoved = totalLinesRemoved(hbs);
  const focusScore = computeFocusScore(hbs);
  const productivityScore = computeProductivityScore(hbs);
  const insights = generateInsights(hbs, streak);

  const handleToggle = async (rowId: string, current: boolean) => {
    setProjects((prev) =>
      prev.map((p) => (p.$id === rowId ? { ...p, trackingEnabled: !current } : p))
    );
    try {
      await toggleProjectTracking(rowId, !current);
    } catch {
      setProjects((prev) =>
        prev.map((p) => (p.$id === rowId ? { ...p, trackingEnabled: current } : p))
      );
    }
  };

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  } as const;

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
  };

  return (
    <motion.div
      className="space-y-4 sm:space-y-5 max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Hero header */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-teal-500 to-emerald-500 p-5 sm:p-6 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
              <span className="text-base sm:text-lg">{getGreetingEmoji()}</span>
              <span className="hidden sm:inline">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="sm:hidden">
                {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              {getGreeting()}, {user.name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-white/90 mt-1 text-xs sm:text-sm">
              {streak > 0
                ? `🔥 ${streak}-day streak — you're on fire!`
                : "Start a new streak today by writing some code."}
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/20">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
              This period
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5">
              {formatDuration(total)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Range picker */}
      <motion.div variants={fadeUp} className="flex justify-end">
        <RangePicker value={range} onChange={setRange} customStart={customStart} customEnd={customEnd} onCustomStartChange={(d) => { setCustomStart(d); localStorage.setItem("wt_custom_start_dash", d); }} onCustomEndChange={(d) => { setCustomEnd(d); localStorage.setItem("wt_custom_end_dash", d); }} />
      </motion.div>

      {loading ? (
        <motion.div variants={fadeUp} className="space-y-4">
          <SkeletonRings />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonTable rows={6} />
        </motion.div>
      ) : (
        <>
          {/* Score rings + stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <motion.div
              className="card p-4 sm:p-5 flex flex-col items-center justify-center"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Focus Score
              </div>
              <FocusRing
                score={focusScore}
                sublabel={
                  focusScore >= 80
                    ? "Excellent"
                    : focusScore >= 50
                      ? "Good"
                      : focusScore >= 25
                        ? "Building"
                        : "Getting started"
                }
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[180px]">
                Longest uninterrupted coding session
              </div>
            </motion.div>

            <motion.div
              className="card p-4 sm:p-5 flex flex-col items-center justify-center"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Productivity
              </div>
              <ProductivityRing score={productivityScore} label="Score" />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-[180px]">
                Based on consistency, focus &amp; volume
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <StatCard
                label="Total"
                value={formatDuration(total)}
                icon="⏱"
                numericValue={total}
                format="duration"
                gradient="bg-gradient-to-br from-brand/5 to-transparent"
              />
              <StatCard
                label="Streak"
                value={`${streak}d`}
                icon="🔥"
                color="text-warm"
                numericValue={streak}
                suffix="d"
                gradient="bg-gradient-to-br from-warm/5 to-transparent"
              />
              <StatCard
                label="Added"
                value={`+${linesAdded}`}
                icon="📈"
                color="text-emerald-600 dark:text-emerald-400"
                numericValue={linesAdded}
                gradient="bg-gradient-to-br from-emerald-500/5 to-transparent"
              />
              <StatCard
                label="Removed"
                value={`-${linesRemoved}`}
                icon="📉"
                color="text-red-500 dark:text-red-400"
                numericValue={linesRemoved}
                gradient="bg-gradient-to-br from-red-500/5 to-transparent"
              />
            </div>
          </motion.div>

          {/* Insights */}
          <ScrollReveal>
            <Insights insights={insights} />
          </ScrollReveal>

          {/* Week strip + Trend */}
          <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <motion.div className="card p-4" whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
              <WeekStrip hbs={hbs} />
            </motion.div>
            <motion.div className="card p-4" whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
              <TrendChart
                data={byDay}
                title="📊 Daily trend"
                onClickDay={(date) => navigate(`/reports?day=${date}`)}
              />
            </motion.div>
          </div></ScrollReveal>

          {/* Timeline */}
          <ScrollReveal>
          <div className="card p-4" style={{ position: "relative" }}>
            <Timeline data={heatmap} />
          </div>
          </ScrollReveal>

          {/* Projects toggle */}
          {projects.length > 0 && (
            <ScrollReveal>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Projects</h3>
                <span className="text-xs text-gray-400">
                  {projects.filter((p) => p.trackingEnabled).length}/{projects.length} active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {projects.map((p) => (
                  <motion.div
                    key={p.$id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <motion.div
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-gray-800"
                        style={{ backgroundColor: p.color }}
                        whileHover={{ scale: 1.3 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      />
                      <span className="font-medium text-sm truncate">{p.name}</span>
                    </div>
                    <button
                      onClick={() => handleToggle(p.$id, p.trackingEnabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                        p.trackingEnabled
                          ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm shadow-emerald-500/30"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <motion.span
                        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm"
                        animate={p.trackingEnabled ? { x: 18 } : { x: 3 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
            </ScrollReveal>
          )}

          {/* Donut charts */}
          <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <motion.div className="card p-4" whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
              <DonutChart
                data={byProject}
                title="By project"
                centerValue={formatDuration(total)}
                centerLabel="Total"
                onItemClick={(name) => navigate(`/reports?project=${encodeURIComponent(name)}`)}
              />
            </motion.div>
            <motion.div className="card p-4" whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
              <DonutChart
                data={byLanguage}
                title="By language"
                centerValue={`${byLanguage.length}`}
                centerLabel="Languages"
                onItemClick={(name) => navigate(`/reports?lang=${encodeURIComponent(name)}`)}
              />
            </motion.div>
          </div>
          </ScrollReveal>

          {/* Files + Heatmap */}
          <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <motion.div
              className="lg:col-span-2 card p-4"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">
                By file (top 10)
              </h3>
              <FileTable data={byFile} total={total} />
            </motion.div>
            <motion.div
              className="card p-4"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">
                Activity heatmap
              </h3>
              <Heatmap
                data={heatmap}
                onCellClick={(day, hour) => navigate(`/reports?dayOfWeek=${day}&hour=${hour}`)}
              />
            </motion.div>
          </div>
          </ScrollReveal>

          {/* Day of week breakdown */}
          <ScrollReveal>
          <div className="card p-4" style={{ position: "relative" }}>
            <h3 className="text-sm font-semibold mb-4 text-gray-600 dark:text-gray-300">
              📅 Day of week breakdown
            </h3>
            {hbs.length > 0 ? <DayOfWeekChart hbs={hbs} /> : <p className="text-sm text-gray-400">No data for this period.</p>}
          </div>
          </ScrollReveal>
        </>
      )}
    </motion.div>
  );
}
