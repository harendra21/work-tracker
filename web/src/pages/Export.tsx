import { useState, useEffect } from "react";
import type { Models } from "appwrite";
import type { Heartbeat, Range } from "../types";
import { fetchHeartbeats } from "../lib/data";
import { getRangeStart } from "../lib/aggregate";
import { exportToCsv, downloadCsv } from "../lib/csv";
import { shortFilePath } from "../lib/format";
import RangePicker from "../components/RangePicker";

export default function Export({ user }: { user: Models.User<Models.Preferences> }) {
  const [range, setRange] = useState<Range>("30d");
  const [hbs, setHbs] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const since = getRangeStart(range);
    fetchHeartbeats(user.$id, since.toISOString())
      .then(setHbs)
      .catch(() => setHbs([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user.$id, range]);

  const handleExport = () => {
    const csv = exportToCsv(hbs);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `work-tracker-${date}.csv`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Export</h2>

      <div className="flex items-center gap-4">
        <RangePicker value={range} onChange={setRange} />
        <span className="text-sm text-gray-500">{hbs.length} heartbeats</span>
      </div>

      <button
        onClick={handleExport}
        disabled={loading || hbs.length === 0}
        className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Download CSV"}
      </button>

      {hbs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Time</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Project</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">File</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Language</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Duration</th>
                </tr>
              </thead>
              <tbody>
                {hbs.slice(0, 100).map((h) => (
                  <tr key={h.$id} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-1.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-1.5">{h.projectName}</td>
                    <td className="px-4 py-1.5 text-gray-600 dark:text-gray-400 max-w-[250px] truncate">
                      {shortFilePath(h.entity, h.projectName)}
                    </td>
                    <td className="px-4 py-1.5">{h.language}</td>
                    <td className="px-4 py-1.5 text-right font-mono">
                      {Math.round(h.durationSeconds)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
