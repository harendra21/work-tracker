import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatDuration } from "../lib/format";

const COLORS = [
  "#5C9EAD",
  "#9CDB89",
  "#E0B450",
  "#C84B31",
  "#8E44AD",
  "#16A085",
  "#D35400",
  "#2D7DD2",
  "#E74C3C",
  "#2ECC71",
];

export default function DonutChart({
  data,
  title,
  centerLabel,
  centerValue,
  onItemClick,
}: {
  data: Array<{ name: string; seconds: number; color?: string }>;
  title: string;
  centerLabel?: string;
  centerValue?: string;
  onItemClick?: (name: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">{title}</h3>
        <p className="text-sm text-gray-400 italic">No data</p>
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.seconds, 0);
  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    pct: total > 0 ? (d.seconds / total) * 100 : 0,
  }));
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">
        {title}
        {onItemClick && (
          <span className="ml-1.5 text-[10px] font-normal text-gray-400">(click to filter)</span>
        )}
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="seconds"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
                onClick={(_d, idx) => {
                  if (onItemClick && chartData[idx]) onItemClick(chartData[idx].name);
                }}
                style={{ cursor: onItemClick ? "pointer" : "default" }}
              >
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color || COLORS[i % COLORS.length]}
                    stroke="none"
                    style={{ cursor: onItemClick ? "pointer" : "default" }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, _name, p) => [
                  formatDuration(v),
                  (p as { payload: { name: string } }).payload.name,
                ]}
                contentStyle={{
                  background: "rgba(17, 24, 39, 0.95)",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {centerValue && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100 count-animate">
                {centerValue}
              </div>
              {centerLabel && (
                <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {centerLabel}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {chartData.map((d, i) => (
            <button
              key={d.name}
              type="button"
              disabled={!onItemClick}
              onClick={() => onItemClick?.(d.name)}
              className="w-full flex items-center gap-2 text-xs group text-left rounded-md px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors disabled:hover:bg-transparent disabled:cursor-default"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-transform group-hover:scale-125"
                style={{ backgroundColor: d.color || COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{d.name}</span>
              <span className="tabular-nums text-gray-500 dark:text-gray-400 font-medium">
                {d.pct.toFixed(0)}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
