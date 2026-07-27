import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";

function useAnimatedNumber(target: number) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 15 });
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
    <motion.div
      className="card card-hover p-4 relative overflow-hidden group"
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {gradient && (
        <motion.div
          className={`absolute inset-0 ${gradient}`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          {icon && (
            <motion.span
              className="text-base opacity-70"
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {icon}
            </motion.span>
          )}
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <motion.div
          className={`text-2xl font-bold tabular-nums ${color ?? "text-gray-800 dark:text-gray-100"}`}
        >
          {display}
        </motion.div>
      </div>
    </motion.div>
  );
}
