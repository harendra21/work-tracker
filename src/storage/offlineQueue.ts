/**
 * Local heartbeat queue backed by a JSON file.
 *
 * Simple file-based storage that avoids native module dependencies.
 * Hearts are stored as an array of objects in a single JSON file.
 */

import * as fs from "fs";
import * as path from "path";
import { Heartbeat } from "../tracker/heartbeat";

interface QueueEntry {
  heartbeat: Heartbeat;
  status: "pending" | "error";
  attempts: number;
  lastError?: string;
}

export class OfflineQueue {
  private filePath: string;
  private entries: QueueEntry[] = [];
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(storageDir: string) {
    fs.mkdirSync(storageDir, { recursive: true });
    this.filePath = path.join(storageDir, "heartbeats.json");
    this.load();
  }

  enqueue(hb: Heartbeat): void {
    if (this.entries.some((e) => e.heartbeat.id === hb.id)) {
      return;
    }
    this.entries.push({ heartbeat: hb, status: "pending", attempts: 0 });
    this.scheduleSave();
  }

  fetchPending(limit: number): Heartbeat[] {
    return this.entries
      .filter((e) => e.status === "pending" || e.status === "error")
      .sort((a, b) => a.heartbeat.timestamp.localeCompare(b.heartbeat.timestamp))
      .slice(0, limit)
      .map((e) => e.heartbeat);
  }

  markSent(id: string): void {
    this.entries = this.entries.filter((e) => e.heartbeat.id !== id);
    this.scheduleSave();
  }

  markError(id: string, err: string): void {
    const entry = this.entries.find((e) => e.heartbeat.id === id);
    if (entry) {
      entry.status = "error";
      entry.attempts++;
      entry.lastError = err.slice(0, 500);
    }
    this.scheduleSave();
  }

  pendingCount(): number {
    return this.entries.filter((e) => e.status === "pending" || e.status === "error").length;
  }

  deleteByUser(userId: string): number {
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.heartbeat.userId !== userId);
    this.scheduleSave();
    return before - this.entries.length;
  }

  deleteById(id: string): void {
    this.entries = this.entries.filter((e) => e.heartbeat.id !== id);
    this.scheduleSave();
  }

  close(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.flush();
  }

  private load(): void {
    try {
      const data = fs.readFileSync(this.filePath, "utf8");
      this.entries = JSON.parse(data) as QueueEntry[];
    } catch {
      this.entries = [];
    }
  }

  private flush(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.entries), "utf8");
    } catch {
      // Best effort
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) {
      return;
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined;
      this.flush();
    }, 1000);
  }
}
