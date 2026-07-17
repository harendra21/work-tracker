import type { Heartbeat } from "../types";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function WeekStrip({ hbs }: { hbs: Heartbeat[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: Date; label: string; seconds: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const seconds = hbs
      .filter((h) => h.timestamp.slice(0, 10) === iso)
      .reduce((s, h) => s + h.durationSeconds, 0);
    days.push({
      date: d,
      label: DAYS[d.getDay()],
      seconds,
      isToday: i === 0,
    });
  }
  const max = Math.max(1, ...days.map((d) => d.seconds));
  const todaySeconds = days[days.length - 1].seconds;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">📅 Last 7 days</h3>
        <span className="text-xs text-gray-500">{Math.round(todaySeconds / 60)}m today</span>
      </div>
      <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-36">
        {days.map((d, i) => {
          const heightPct = (d.seconds / max) * 100;
          const hrs = Math.floor(d.seconds / 3600);
          const mins = Math.round((d.seconds % 3600) / 60);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group cursor-default"
            >
              <div className="text-[10px] text-gray-500 tabular-nums mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.seconds > 0 ? (hrs > 0 ? `${hrs}h${mins}m` : `${mins}m`) : "—"}
              </div>
              <div
                className={`w-full rounded-t-md transition-all duration-700 ${
                  d.isToday
                    ? "bg-gradient-to-t from-brand to-teal-500 shadow-md shadow-brand/20"
                    : d.seconds > 0
                      ? "bg-gradient-to-t from-brand/60 to-teal-400/60"
                      : "bg-gray-200/60 dark:bg-gray-700/40"
                }`}
                style={{
                  height: d.seconds > 0 ? `${Math.max(8, heightPct)}%` : "4px",
                }}
              />
              <div
                className={`text-[10px] mt-1.5 font-medium ${
                  d.isToday ? "text-brand font-bold" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {d.isToday ? "Today" : d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
