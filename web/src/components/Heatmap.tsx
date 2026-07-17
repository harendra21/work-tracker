import type { HourlyHeatmap } from "../types";
import { useMemo } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Heatmap({
  data,
  onCellClick,
}: {
  data: HourlyHeatmap[];
  onCellClick?: (day: number, hour: number) => void;
}) {
  const { max, grid } = useMemo(() => {
    const m = Math.max(1, ...data.map((d) => d.seconds));
    const g: HourlyHeatmap[][] = Array.from({ length: 7 }, () => []);
    for (const d of data) g[d.day].push(d);
    return { max: m, grid: g };
  }, [data]);

  const getColor = (v: number) => {
    if (v === 0) return "rgba(156, 163, 175, 0.08)";
    const intensity = Math.min(1, Math.pow(v / max, 0.6));
    const r = Math.round(92 + (92 - 92) * intensity);
    const g = Math.round(158 + (219 - 158) * intensity);
    const b = Math.round(173 + (137 - 173) * intensity);
    return `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`;
  };

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="inline-block min-w-full">
        <div className="flex items-end gap-0.5 mb-1 ml-10 text-[10px] text-gray-400">
          {[0, 6, 12, 18, 23].map((h) => (
            <div key={h} style={{ width: `${(100 / 24) * 3}%` }} className="text-center">
              {h.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
        {grid.map((row, day) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <div className="w-10 text-[10px] text-gray-500 dark:text-gray-400 font-medium pr-2 text-right">
              {DAYS[day]}
            </div>
            {row.map((cell) => (
              <div
                key={cell.hour}
                onClick={() => onCellClick?.(day, cell.hour)}
                className={`flex-1 h-5 rounded-sm transition-all duration-200 hover:scale-110 hover:ring-2 hover:ring-brand/30 ${
                  onCellClick ? "cursor-pointer" : "cursor-default"
                }`}
                style={{ backgroundColor: getColor(cell.seconds) }}
                title={`${DAYS[day]} ${cell.hour.toString().padStart(2, "0")}:00 — ${(cell.seconds / 60).toFixed(0)}m`}
              />
            ))}
          </div>
        ))}
        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-gray-500">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <div
                key={v}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(v * max) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
