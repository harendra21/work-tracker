import { describe, it, expect } from "vitest";
import { HeartbeatServiceImpl } from "../src/api/heartbeats";
import { Heartbeat } from "../src/tracker/heartbeat";

const tz = "UTC";
const _day = (iso: string) => iso.slice(0, 10);

function hb(partial: Partial<Heartbeat>): Heartbeat {
  return {
    id: partial.id ?? "id-" + Math.random(),
    userId: "u",
    projectId: "p1",
    projectName: partial.projectName ?? "demo",
    entity: partial.entity ?? "src/index.ts",
    language: partial.language ?? "TypeScript",
    branch: partial.branch ?? "main",
    category: "coding",
    timestamp: partial.timestamp ?? new Date().toISOString(),
    durationSeconds: partial.durationSeconds ?? 10,
    isWrite: false,
    linesAdded: partial.linesAdded ?? 0,
    linesRemoved: partial.linesRemoved ?? 0,
    machineId: "m",
    editor: "VS Code",
  };
}

describe("HeartbeatServiceImpl.aggregate", () => {
  it("groups by day + project + language", () => {
    const hbs = [
      hb({
        id: "1",
        timestamp: "2025-01-01T10:00:00.000Z",
        projectId: "p1",
        language: "TypeScript",
        durationSeconds: 30,
      }),
      hb({
        id: "2",
        timestamp: "2025-01-01T10:05:00.000Z",
        projectId: "p1",
        language: "TypeScript",
        durationSeconds: 60,
      }),
      hb({
        id: "3",
        timestamp: "2025-01-01T10:10:00.000Z",
        projectId: "p1",
        language: "Python",
        durationSeconds: 15,
      }),
      hb({
        id: "4",
        timestamp: "2025-01-02T10:00:00.000Z",
        projectId: "p1",
        language: "TypeScript",
        durationSeconds: 90,
      }),
    ];
    const summaries = HeartbeatServiceImpl.aggregate(hbs, tz);
    expect(summaries.length).toBe(3);
    const ts = summaries.find((s) => s.language === "TypeScript" && s.date === "2025-01-01")!;
    expect(ts.totalSeconds).toBe(90);
    expect(ts.sessions).toBe(2);
    const py = summaries.find((s) => s.language === "Python")!;
    expect(py.date).toBe("2025-01-01");
    expect(py.totalSeconds).toBe(15);
  });
});
