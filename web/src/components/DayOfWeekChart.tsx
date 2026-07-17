import type { Heartbeat } from "../types";
import { formatDuration } from "../lib/format";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BAR_COLORS = [
  "from-red-400 to-red-500",
  "from-orange-400 to-orange-500",
  "from-amber-400 to-amber-500",
  "from-emerald-400 to-emerald-500",
  "from-teal-400 to-teal-500",
  "from-blue-400 to-blue-500",
  "from-purple-400 to-purple-500",
];

export default function DayOfWeekChart({ hbs }: { hbs: Heartbeat[] }) {
  const byDay = new Array(7).fill(0);
  for (const h of hbs) {
    const d = new Date(h.timestamp);
    byDay[d.getDay()] += h.durationSeconds;
  }

  const maxVal = Math.max(...byDay, 1);
  const total = byDay.reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-2">
      {DAYS.map((day, i) => {
        const val = byDay[i];
        const pct = total > 0 ? (val / total) * 100 : 0;
        return (
          <div key={day} className="flex items-center gap-3">
            <span className="w-24 text-xs text-gray-600 dark:text-gray-400 shrink-0 text-right">
              {day.slice(0, 3)}
            </span>
            <div className="flex-1 h-5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[i]} transition-all duration-700`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="w-20 text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-200 shrink-0 text-right">
              {formatDuration(val)}
            </span>
            <span className="w-10 text-xs text-gray-400 tabular-nums shrink-0 text-right">
              {pct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
