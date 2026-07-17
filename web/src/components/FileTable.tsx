import type { AggregatedFile } from "../types";
import { formatDuration, pct } from "../lib/format";

export default function FileTable({ data, total }: { data: AggregatedFile[]; total: number }) {
  const top = data.slice(0, 10);
  if (top.length === 0) {
    return <p className="text-sm text-gray-500 italic">No data for this range yet.</p>;
  }
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left font-medium py-2 pr-3">File</th>
              <th className="text-left font-medium py-2 pr-3">Language</th>
              <th className="text-right font-medium py-2 pr-3">Time</th>
              <th className="text-right font-medium py-2 pr-3">Sessions</th>
              <th className="text-right font-medium py-2 pr-3">Lines</th>
              <th className="text-left font-medium py-2 pl-3 w-40">Share</th>
            </tr>
          </thead>
          <tbody>
            {top.map((f) => (
              <tr
                key={f.name}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-2 pr-3 font-mono text-xs max-w-xs truncate" title={f.fullPath}>
                  {f.name}
                </td>
                <td className="py-2 pr-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {f.language || "text"}
                  </span>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatDuration(f.seconds)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{f.sessions}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400">+{f.linesAdded}</span>{" "}
                  <span className="text-red-500 dark:text-red-400">−{f.linesRemoved}</span>
                </td>
                <td className="py-2 pl-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct(f.seconds, total)}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums w-10 text-right text-gray-500">
                      {f.pct.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {top.map((f, i) => (
          <div
            key={f.name}
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="font-mono text-xs truncate flex-1" title={f.fullPath}>
                {f.name}
              </div>
              <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] flex-shrink-0">
                {f.language || "text"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand tabular-nums">{formatDuration(f.seconds)}</span>
              <span className="text-gray-500 tabular-nums">
                {f.sessions} session{f.sessions !== 1 ? "s" : ""}
              </span>
              <span className="tabular-nums">
                <span className="text-emerald-600 dark:text-emerald-400">+{f.linesAdded}</span>
                <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                <span className="text-red-500 dark:text-red-400">−{f.linesRemoved}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${f.pct}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-400 mt-1 text-right tabular-nums">
              {f.pct.toFixed(1)}% of total
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
