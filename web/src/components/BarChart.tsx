import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

export default function BarChart({
  data,
  title,
}: {
  data: Array<{ name: string; seconds: number; color?: string }>;
  title: string;
}) {
  if (data.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">{title}</h3>
        <p className="text-sm text-gray-400 italic">No data</p>
      </div>
    );
  }
  const chartData = data.slice(0, 10).map((d) => ({
    ...d,
    label: d.name.length > 24 ? d.name.slice(0, 22) + "…" : d.name,
  }));
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 36)}>
        <RechartsBar
          layout="vertical"
          data={chartData}
          margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: number) => formatDuration(v)}
            contentStyle={{
              background: "var(--vscode-editorWidget-background, #fff)",
              border: "1px solid var(--vscode-editorWidget-border, #ddd)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Bar dataKey="seconds" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color || COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
