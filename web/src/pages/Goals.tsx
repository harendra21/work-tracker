import { useState, useEffect, useMemo, useRef } from "react";
import type { Models } from "appwrite";
import { fetchGoals, createGoal, deleteGoal, updateGoal, fetchHeartbeats, fetchProjects } from "../lib/data";
import { computeGoalProgress, getWeekStartISO } from "../lib/aggregate";
import { formatDuration, getGoalColor, parseList } from "../lib/format";
import { getUserTimezone } from "../lib/timezone";
import GoalProgressRing from "../components/GoalProgressRing";
import { SkeletonGoal } from "../components/Skeleton";
import type { Heartbeat, Project } from "../types";

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

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-all flex items-center ${
        enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
      title={enabled ? "Pause" : "Resume"}
      aria-label={enabled ? "Pause goal" : "Resume goal"}
    >
      <span
        className={`block w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-[19px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export default function Goals({ user }: { user: Models.User<Models.Preferences> }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hbs, setHbs] = useState<Heartbeat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(2);
  const [delta, setDelta] = useState<"day" | "week">("day");
  const [languagesInput, setLanguagesInput] = useState<string[]>([]);
  const [projectsInput, setProjectsInput] = useState<string[]>([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const availableLangs = useMemo(() => [...new Set(hbs.map((h) => h.language).filter(Boolean))].sort(), [hbs]);
  const projectNames = useMemo(() => projects.map((p) => p.name).sort(), [projects]);
  const [adding, setAdding] = useState(false);
  const [tick, setTick] = useState(0);
  const [wasHitMap, setWasHitMap] = useState<Record<string, boolean>>({});
  const hitPulseRef = useRef<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const tz = getUserTimezone(user);

  const load = async () => {
    setLoading(true);
    try {
      const sinceISO = getWeekStartISO(tz);
      const [rows, hbRes, projRes] = await Promise.all([
        fetchGoals(user.$id),
        fetchHeartbeats(user.$id, sinceISO, 10000),
        fetchProjects(user.$id),
      ]);
      const goalRows = rows as unknown as Goal[];
      setGoals(goalRows);
      setHbs(hbRes);
      setProjects(projRes as unknown as Project[]);
      const hit: Record<string, boolean> = {};
      for (const g of goalRows) {
        if (!g.isEnabled) continue;
        const p = computeGoalProgress(g, hbRes, tz);
        hit[g.$id] = p.isHit;
      }
      setWasHitMap(hit);
    } catch {
      setGoals([]);
      setHbs([]);
      setProjects([]);
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
      const p = computeGoalProgress(g, hbs, tz);
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
        languages: languagesInput.length > 0 ? languagesInput : undefined,
        projects: projectsInput.length > 0 ? projectsInput : undefined,
        isEnabled: true,
      });
      setTitle("");
      setLanguagesInput([]);
      setProjectsInput([]);
      setShowForm(false);
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
    return goals
      .filter((g) => {
        if (!filterKeyword) return true;
        const kw = filterKeyword.toLowerCase();
        return (
          g.title.toLowerCase().includes(kw) ||
          g.languages?.toLowerCase().includes(kw) ||
          g.projects?.toLowerCase().includes(kw)
        );
      })
      .map((g) => {
        const progress = computeGoalProgress(g, hbs, tz);
        const color = getGoalColor(progress.percent);
        const langs = parseList(g.languages);
        const projs = parseList(g.projects);
        const wasHit = wasHitMap[g.$id] ?? false;
        const justHit = !wasHit && progress.isHit;
        return { goal: g, progress, color, langs, projs, justHit };
      });
  }, [goals, hbs, wasHitMap, filterKeyword]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🎯</span> Goals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set coding time targets and watch your progress live.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary text-sm"
        >
          {showForm ? "Cancel" : "+ New Goal"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-5 space-y-4 animate-slide-up">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Goal name
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Daily coding", "Side project hours"'
              className="input"
              autoFocus
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Languages {languagesInput.length > 0 && <span className="text-brand font-mono">({languagesInput.length})</span>}
              </label>
              {availableLangs.length === 0 ? (
                <input
                  value={languagesInput.join(", ")}
                  onChange={(e) => setLanguagesInput(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="Type manually..."
                  className="input"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {availableLangs.map((l) => {
                    const active = languagesInput.includes(l);
                    return (
                      <button
                        type="button"
                        key={l}
                        onClick={() =>
                          setLanguagesInput(
                            active ? languagesInput.filter((x) => x !== l) : [...languagesInput, l]
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-brand to-teal-500 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Projects {projectsInput.length > 0 && <span className="text-brand font-mono">({projectsInput.length})</span>}
              </label>
              {projectNames.length === 0 ? (
                <input
                  value={projectsInput.join(", ")}
                  onChange={(e) => setProjectsInput(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="Type manually..."
                  className="input"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {projectNames.map((p) => {
                    const active = projectsInput.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() =>
                          setProjectsInput(
                            active ? projectsInput.filter((x) => x !== p) : [...projectsInput, p]
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-brand to-teal-500 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={adding || !title.trim()} className="btn-primary w-full">
            {adding ? "Adding..." : "+ Add Goal"}
          </button>
        </form>
      )}

      {goals.length > 0 && (
        <div className="flex items-center gap-2 animate-fade-in">
          <input
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            placeholder="Filter goals by name, language, or project..."
            className="input flex-1"
          />
          {filterKeyword && (
            <button
              onClick={() => setFilterKeyword("")}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-fade-in">
          <SkeletonGoal />
          <SkeletonGoal />
        </div>
      ) : goalCards.length === 0 ? (
        <div className="card p-10 text-center animate-fade-in">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-gray-500 dark:text-gray-400 mb-1">No goals yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Click <strong>+ New Goal</strong> to create your first coding target.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goalCards.map(({ goal: g, progress, color, langs, projs, justHit }) => {
            const isPaused = !g.isEnabled;
            return (
              <div
                key={g.$id}
                className={`card p-5 transition-all animate-slide-up ${
                  justHit ? "ring-2 ring-emerald-400/50" : "hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className={`shrink-0 ${justHit ? "animate-ring-hit" : ""}`}>
                    <GoalProgressRing
                      percent={progress.percent}
                      color={color}
                      size={160}
                      strokeWidth={12}
                      actualSeconds={progress.actualSeconds}
                      targetSeconds={progress.targetSeconds}
                      isHit={progress.isHit}
                      isPaused={isPaused}
                      windowLabel={progress.windowLabel}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pt-1 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="shrink-0">{g.delta === "day" ? "📅" : "📆"}</span>
                      <h3 className="font-semibold truncate">{g.title}</h3>
                      {progress.isHit ? (
                        <span className="badge shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          🎉 Hit!
                        </span>
                      ) : (
                        <span
                          className={`badge shrink-0 ${
                            g.isEnabled
                              ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {g.isEnabled ? "Active" : "Paused"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-bold tabular-nums shrink-0" style={{ color, fontSize: "1.1rem" }}>
                        {Math.round(progress.percent)}%
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden min-w-[80px] max-w-[240px]">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${Math.min(progress.percent, 100)}%`,
                            backgroundColor: isPaused ? "#9CA3AF" : color,
                            opacity: isPaused ? 0.5 : 1,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 whitespace-nowrap">
                        {formatDuration(g.seconds)} target
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                      {progress.isHit ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Achieved! +{formatDuration(Math.max(0, progress.actualSeconds - progress.targetSeconds))} over
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDuration(progress.remainingSeconds)} remaining · {progress.windowLabel}
                        </span>
                      )}
                    </div>

                    {(langs.length > 0 || projs.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {langs.map((l: string) => (
                          <span key={l} className="badge bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {l}
                          </span>
                        ))}
                        {projs.map((p: string) => (
                          <span key={p} className="badge bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 pt-1 shrink-0">
                    <Toggle enabled={g.isEnabled} onToggle={() => handleToggle(g)} />
                    <button
                      onClick={() => handleDelete(g.$id)}
                      className="w-7 h-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete goal"
                      aria-label="Delete goal"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
