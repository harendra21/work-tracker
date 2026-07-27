import { motion } from "framer-motion";

export default function ProductivityRing({
  score,
  label = "Score",
}: {
  score: number;
  label?: string;
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#5C9EAD" : score >= 40 ? "#E0B450" : "#9CDB89";

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: 120, height: 120 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
    >
      <svg width="120" height="120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {score}
        </motion.div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
