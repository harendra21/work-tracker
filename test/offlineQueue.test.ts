import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { OfflineQueue } from "../src/storage/offlineQueue";
import { Heartbeat } from "../src/tracker/heartbeat";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "wt-queue-"));
}

function makeHb(id: string, projectId = "p1", userId = "u1"): Heartbeat {
  return {
    id,
    userId,
    projectId,
    projectName: "demo",
    entity: "src/index.ts",
    language: "TypeScript",
    branch: "main",
    category: "coding",
    timestamp: new Date().toISOString(),
    durationSeconds: 5,
    isWrite: false,
    linesAdded: 0,
    linesRemoved: 0,
    machineId: "m1",
    editor: "VS Code",
  };
}

describe("OfflineQueue", () => {
  let dir: string;
  let q: OfflineQueue;

  beforeEach(() => {
    dir = tmpDir();
    q = new OfflineQueue(dir);
  });

  afterEach(() => {
    q.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("enqueues and retrieves pending heartbeats in order", () => {
    q.enqueue(makeHb("a"));
    q.enqueue(makeHb("b"));
    q.enqueue(makeHb("c"));
    const list = q.fetchPending(10);
    expect(list.map((h) => h.id)).toEqual(["a", "b", "c"]);
    expect(q.pendingCount()).toBe(3);
  });

  it("marks heartbeats as sent", () => {
    q.enqueue(makeHb("a"));
    q.markSent("a");
    expect(q.pendingCount()).toBe(0);
  });

  it("marks heartbeats as errored and keeps them", () => {
    q.enqueue(makeHb("a"));
    q.markError("a", "boom");
    // Row still in the queue (will be retried on the next tick)
    expect(q.pendingCount()).toBe(1);
  });

  it("is idempotent on enqueue", () => {
    q.enqueue(makeHb("a"));
    q.enqueue(makeHb("a"));
    expect(q.pendingCount()).toBe(1);
  });

  it("deletes by user", () => {
    q.enqueue(makeHb("a", "p1", "u1"));
    q.enqueue(makeHb("b", "p1", "u2"));
    const deleted = q.deleteByUser("u1");
    expect(deleted).toBe(1);
    expect(q.pendingCount()).toBe(1);
  });
});
