import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatDuration } from "../lib/format";

export default function TrendChart({
  data,
  title,
  onClickDay,
}: {
  data: Array<{ date: string; seconds: number }>;
  title: string;
  onClickDay?: (date: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">{title}</h3>
        <p className="text-sm text-gray-400 italic">No data</p>
      </div>
    );
  }
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {title}
          {onClickDay && (
            <span className="ml-1.5 text-[10px] font-normal text-gray-400">(click to view)</span>
          )}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-brand to-teal-500" />
            Daily
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ left: 0, right: 10, top: 5, bottom: 0 }}
          onClick={(e) => {
            if (!onClickDay || !e || !e.activeLabel) return;
            const idx = chartData.findIndex((d) => d.label === e.activeLabel);
            if (idx >= 0) onClickDay(chartData[idx].date);
          }}
          style={{ cursor: onClickDay ? "pointer" : "default" }}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5C9EAD" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#9CDB89" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(156, 163, 175, 0.15)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-gray-400"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "currentColor" }}
            width={48}
            tickFormatter={(v) => formatDuration(v)}
            className="text-gray-400"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number) => [formatDuration(v), "Time"]}
            contentStyle={{
              background: "rgba(17, 24, 39, 0.95)",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              color: "#fff",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
            itemStyle={{ color: "#9CDB89" }}
            labelStyle={{ color: "#fff", fontWeight: 600 }}
            cursor={{ stroke: "#5C9EAD", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="seconds"
            stroke="#5C9EAD"
            fill="url(#trendGradient)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#5C9EAD", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#9CDB89", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
