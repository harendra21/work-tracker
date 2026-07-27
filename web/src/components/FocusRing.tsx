import { motion } from "framer-motion";

export default function FocusRing({
  score,
  label = "Focus",
  sublabel,
}: {
  score: number;
  label?: string;
  sublabel?: string;
}) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#10b981" : score >= 50 ? "#5C9EAD" : score >= 25 ? "#E0B450" : "#9CA3AF";

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: 140, height: 140 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
    >
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-3xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {score}
        </motion.div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          {label}
        </div>
        {sublabel && <div className="text-[10px] text-gray-400 mt-0.5">{sublabel}</div>}
      </div>
    </motion.div>
  );
}
