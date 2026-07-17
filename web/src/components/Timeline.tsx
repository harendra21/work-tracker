import { useMemo } from "react";

export default function Timeline({
  data,
}: {
  data: Array<{ day: number; hour: number; seconds: number }>;
}) {
  const { max, hours } = useMemo(() => {
    const m = Math.max(1, ...data.map((d) => d.seconds));
    const h: number[] = Array(24).fill(0);
    for (const d of data) h[d.hour] += d.seconds;
    return { max: m, hours: h };
  }, [data]);

  const getHeight = (v: number) => Math.max(2, (v / max) * 100);
  const activeHours = hours.filter((v) => v > 0).length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">📈 When you code</h3>
        <span className="text-xs text-gray-500">{activeHours} active hours</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {hours.map((v, h) => (
          <div key={h} className="flex-1 flex flex-col items-center justify-end group relative">
            <div
              className="w-full rounded-t-sm transition-all duration-500 group-hover:opacity-80"
              style={{
                height: `${getHeight(v)}%`,
                background:
                  v > 0 ? `linear-gradient(to top, #5C9EAD, #9CDB89)` : "rgba(156, 163, 175, 0.15)",
                minHeight: v > 0 ? "4px" : "2px",
              }}
            />
            {h % 6 === 0 && (
              <div className="text-[9px] text-gray-400 mt-1 tabular-nums">
                {h.toString().padStart(2, "0")}
              </div>
            )}
            <div className="absolute bottom-full mb-1 px-1.5 py-0.5 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {h.toString().padStart(2, "0")}:00 — {Math.round(v / 60)}m
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
