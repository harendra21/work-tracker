import { useState, useEffect, useMemo, useRef } from "react";
import type { Models } from "appwrite";
import { fetchGoals, createGoal, deleteGoal, updateGoal, fetchHeartbeats } from "../lib/data";
import { computeGoalProgress, getWeekStartISO } from "../lib/aggregate";
import { formatDuration, getGoalColor, parseList } from "../lib/format";
import GoalProgressRing from "../components/GoalProgressRing";
import { SkeletonGoal } from "../components/Skeleton";
import type { Heartbeat } from "../types";

interface Goal {
  $id: string;
  title: string;
  delta: "day" | "week";
  seconds: number;
  languages: string;
  projects: string;
  isEnabled: boolean;
  createdAt: string;
}

const DELTAS: { value: "day" | "week"; label: string; icon: string }[] = [
  { value: "day", label: "Daily", icon: "📅" },
  { value: "week", label: "Weekly", icon: "📆" },
];

const PRESET_HOURS = [1, 2, 4, 6, 8];

export default function Goals({ user }: { user: Models.User<Models.Preferences> }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hbs, setHbs] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(2);
  const [delta, setDelta] = useState<"day" | "week">("day");
  const [adding, setAdding] = useState(false);
  const [tick, setTick] = useState(0);
  const [wasHitMap, setWasHitMap] = useState<Record<string, boolean>>({});
  const hitPulseRef = useRef<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const sinceISO = getWeekStartISO();
      const [rows, hbRes] = await Promise.all([
        fetchGoals(user.$id),
        fetchHeartbeats(user.$id, sinceISO, 10000),
      ]);
      const goalRows = rows as unknown as Goal[];
      setGoals(goalRows);
      setHbs(hbRes);
      const hit: Record<string, boolean> = {};
      for (const g of goalRows) {
        if (!g.isEnabled) continue;
        const p = computeGoalProgress(g, hbRes);
        hit[g.$id] = p.isHit;
      }
      setWasHitMap(hit);
    } catch {
      setGoals([]);
      setHbs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.$id]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (goals.length === 0) return;
    const next: Record<string, boolean> = {};
    for (const g of goals) {
      if (!g.isEnabled) {
        next[g.$id] = wasHitMap[g.$id] ?? false;
        continue;
      }
      const p = computeGoalProgress(g, hbs);
      const wasHit = wasHitMap[g.$id] ?? false;
      if (!wasHit && p.isHit && !hitPulseRef.current[g.$id]) {
        hitPulseRef.current[g.$id] = true;
      }
      next[g.$id] = p.isHit;
    }
    if (JSON.stringify(next) !== JSON.stringify(wasHitMap)) {
      setWasHitMap(next);
    }
  }, [tick, goals, hbs]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      await createGoal(user.$id, {
        title: title.trim(),
        delta,
        seconds: hours * 3600,
        isEnabled: true,
      });
      setTitle("");
      await load();
    } catch (err) {
      alert("Failed to create goal: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    await deleteGoal(id);
    load();
  };

  const handleToggle = async (g: Goal) => {
    try {
      await updateGoal(g.$id, { isEnabled: !g.isEnabled });
      setGoals((prev) =>
        prev.map((x) => (x.$id === g.$id ? { ...x, isEnabled: !g.isEnabled } : x))
      );
    } catch {
      alert("Failed to update goal");
    }
  };

  const goalCards = useMemo(() => {
    return goals.map((g) => {
      const progress = computeGoalProgress(g, hbs);
      const color = getGoalColor(progress.percent);
      const langs = parseList(g.languages);
      const projs = parseList(g.projects);
      const wasHit = wasHitMap[g.$id] ?? false;
      const justHit = !wasHit && progress.isHit;
      return { goal: g, progress, color, langs, projs, justHit };
    });
  }, [goals, hbs, wasHitMap]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🎯</span> Goals
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Set coding time targets and watch your progress live.
        </p>
      </div>

      <form onSubmit={handleAdd} className="card p-5 space-y-4 animate-slide-up">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Goal name
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Daily coding time, Side project hours..."
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Period
            </label>
            <div className="flex gap-1.5">
              {DELTAS.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setDelta(d.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    delta === d.value
                      ? "bg-gradient-to-r from-brand to-teal-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <span className="mr-1">{d.icon}</span> {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Target hours
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_HOURS.map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHours(h)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hours === h
                      ? "bg-gradient-to-r from-brand to-teal-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {h}h
                </button>
              ))}
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 1)}
                className="w-16 input text-center"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={adding || !title.trim()} className="btn-primary w-full">
          {adding ? "Adding..." : "+ Add Goal"}
        </button>
      </form>

      {loading ? (
        <div className="space-y-3 animate-fade-in">
          <SkeletonGoal />
          <SkeletonGoal />
          <SkeletonGoal />
        </div>
      ) : goalCards.length === 0 ? (
        <div className="card p-8 text-center animate-fade-in">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-500 dark:text-gray-400">No goals yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goalCards.map(({ goal: g, progress, color, langs, projs, justHit }) => {
            const isPaused = !g.isEnabled;
            const remaining = progress.remainingSeconds;
            const overshoot = Math.max(0, progress.actualSeconds - progress.targetSeconds);
            return (
              <div
                key={g.$id}
                className={`card p-4 hover:shadow-md transition-all animate-slide-up ${
                  justHit ? "animate-ring-hit" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={justHit ? "animate-ring-hit" : undefined}>
                    <GoalProgressRing
                      percent={progress.percent}
                      color={color}
                      actualSeconds={progress.actualSeconds}
                      targetSeconds={progress.targetSeconds}
                      isHit={progress.isHit}
                      isPaused={isPaused}
                      windowLabel={progress.windowLabel}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{g.delta === "day" ? "📅" : "📆"}</span>
                      <h3 className="font-semibold truncate">{g.title}</h3>
                      {progress.isHit ? (
                        <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          🎉 Goal hit!
                        </span>
                      ) : (
                        <span
                          className={`badge ${
                            g.isEnabled
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {g.isEnabled ? "Active" : "Paused"}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 text-sm flex items-center gap-2 flex-wrap">
                      <span className="font-semibold tabular-nums" style={{ color }}>
                        {Math.round(progress.percent)}%
                      </span>
                      {progress.isHit ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{formatDuration(overshoot)} over
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDuration(remaining)} to go · {formatDuration(g.seconds)} target
                        </span>
                      )}
                    </div>

                    {(langs.length > 0 || projs.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {langs.map((l: string) => (
                          <span
                            key={l}
                            className="badge bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {l}
                          </span>
                        ))}
                        {projs.map((p: string) => (
                          <span
                            key={p}
                            className="badge bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => handleToggle(g)}
                      className={`w-9 h-5 rounded-full transition-all ${
                        g.isEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      title={g.isEnabled ? "Pause goal" : "Resume goal"}
                    >
                      <span
                        className={`block w-3.5 h-3.5 rounded-full bg-white shadow transform transition-transform mt-[3px] ${
                          g.isEnabled ? "translate-x-[20px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(g.$id)}
                      className="w-7 h-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete goal"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
