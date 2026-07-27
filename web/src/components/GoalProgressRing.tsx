import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { formatDuration } from "../lib/format";

function useAnimatedNumber(target: number): number {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 18 });
  const [value, setValue] = useState(0);
  useEffect(() => {
    const unsubscribe = spring.on("change", setValue);
    return unsubscribe;
  }, [spring]);
  useEffect(() => {
    motionValue.set(target);
  }, [target, motionValue]);
  return value;
}

export default function GoalProgressRing({
  percent,
  color,
  size = 96,
  strokeWidth = 8,
  display = "time",
  actualSeconds = 0,
  targetSeconds = 0,
  isHit = false,
  isPaused = false,
  windowLabel = "today",
}: {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  display?: "time" | "percent";
  actualSeconds?: number;
  targetSeconds?: number;
  isHit?: boolean;
  isPaused?: boolean;
  windowLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const visualPercent = Math.min(percent, 100);
  const offset = circumference - (visualPercent / 100) * circumference;

  const animatedPct = useAnimatedNumber(percent);
  const animatedActual = useAnimatedNumber(actualSeconds);

  const center =
    display === "percent" ? `${Math.round(animatedPct)}%` : formatDuration(animatedActual);
  const sub =
    display === "percent" ? formatDuration(actualSeconds) : `/ ${formatDuration(targetSeconds)}`;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 overflow-visible"
      style={{ width: size, height: size }}
      aria-label={`${Math.round(percent)}% of ${formatDuration(targetSeconds)} goal ${isHit ? "achieved" : "achieved so far"}`}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isPaused ? "#9CA3AF" : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          animate={{
            strokeDashoffset: offset,
            opacity: isPaused ? 0.5 : 1,
            filter: isHit && !isPaused ? `drop-shadow(0 0 6px ${color}80)` : "drop-shadow(0 0 0px transparent)",
          }}
          transition={{
            strokeDashoffset: { type: "spring", stiffness: 80, damping: 18 },
            opacity: { duration: 0.3 },
            filter: { duration: 0.3 },
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-bold tabular-nums leading-none"
          style={{ color: isPaused ? "#9CA3AF" : color, fontSize: size * 0.22 }}
        >
          {center}
        </div>
        <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">{sub}</div>
        {display === "time" && <div className="text-[9px] text-gray-400 mt-0.5">{windowLabel}</div>}
      </div>
    </div>
  );
}
