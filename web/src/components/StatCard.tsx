import { useEffect, useState } from "react";

function useAnimatedNumber(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function formatTimeShort(seconds: number): string {
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) {
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  }
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

export default function StatCard({
  label,
  value,
  icon,
  color,
  numericValue,
  suffix = "",
  gradient,
  format = "number",
}: {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  numericValue?: number;
  suffix?: string;
  gradient?: string;
  format?: "number" | "duration";
}) {
  const animated = useAnimatedNumber(numericValue ?? 0);
  const showNumeric = numericValue !== undefined;
  const display = showNumeric
    ? format === "duration"
      ? formatTimeShort(animated)
      : Math.round(animated) + suffix
    : value;
  return (
    <div className="card card-hover p-4 relative overflow-hidden group">
      {gradient && (
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
        />
      )}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          {icon && (
            <span className="text-base opacity-70 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </span>
          )}
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div
          className={`text-2xl font-bold tabular-nums ${color ?? "text-gray-800 dark:text-gray-100"}`}
        >
          {display}
        </div>
      </div>
    </div>
  );
}
