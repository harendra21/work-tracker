import type { Heartbeat } from "../types";

export function exportToCsv(hbs: Heartbeat[]): string {
  const headers = [
    "timestamp",
    "project",
    "file",
    "language",
    "branch",
    "category",
    "duration_seconds",
    "is_write",
    "lines_added",
    "lines_removed",
    "editor",
  ];
  const rows = hbs.map((h) => [
    h.timestamp,
    h.projectName,
    h.entity,
    h.language,
    h.branch,
    h.category,
    String(h.durationSeconds),
    String(h.isWrite),
    String(h.linesAdded),
    String(h.linesRemoved),
    h.editor,
  ]);
  const csvEscape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  };
  const lines = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\n");
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
