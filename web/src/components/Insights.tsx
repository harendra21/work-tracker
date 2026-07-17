import type { Insight } from "../lib/insights";

export default function Insights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="card p-4 animate-slide-up" style={{ animationDelay: "50ms" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">💡</span>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Insights</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={`relative p-3 rounded-xl bg-gradient-to-br ${ins.color} border border-gray-200/50 dark:border-gray-700/50 overflow-hidden group hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {ins.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                  {ins.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {ins.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
