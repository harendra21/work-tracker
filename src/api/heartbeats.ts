/**
 * Heartbeat upload + daily summary read APIs.
 */
import { AppwriteServices, COLLECTIONS, DB_ID } from "./appwriteClient";
import { Heartbeat } from "../tracker/heartbeat";
import { Query, Models } from "appwrite";
import { WorkTrackerConfig } from "../config";

export interface DailySummary extends Models.Row {
  userId: string;
  date: string;
  projectId: string;
  projectName: string;
  language: string;
  totalSeconds: number;
  linesAdded: number;
  linesRemoved: number;
  sessions: number;
}

export interface HeartbeatService {
  upload(hb: Heartbeat): Promise<void>;
  fetchRecentHeartbeats(limit: number): Promise<Heartbeat[]>;
}

export class HeartbeatServiceImpl implements HeartbeatService {
  constructor(
    private readonly svcs: AppwriteServices,
    private readonly config: WorkTrackerConfig
  ) {}

  private get userId(): string | undefined {
    return this.config?.userId || undefined;
  }

  async upload(hb: Heartbeat): Promise<void> {
    await this.svcs.tables.createRow({
      databaseId: DB_ID,
      tableId: COLLECTIONS.heartbeats,
      rowId: hb.id,
      data: {
        userId: hb.userId,
        projectId: hb.projectId,
        projectName: hb.projectName,
        entity: hb.entity,
        language: hb.language,
        branch: hb.branch,
        category: hb.category,
        timestamp: hb.timestamp,
        durationSeconds: hb.durationSeconds,
        isWrite: hb.isWrite,
        linesAdded: hb.linesAdded,
        linesRemoved: hb.linesRemoved,
        machineId: hb.machineId,
        editor: hb.editor,
      },
    });
  }

  async fetchRecentHeartbeats(limit: number): Promise<Heartbeat[]> {
    const uid = this.userId;
    if (!uid) {
      return [];
    }
    const result = await this.svcs.tables.listRows<
      Models.Row & {
        userId: string;
        projectId: string;
        projectName: string;
        entity: string;
        language: string;
        branch: string;
        category: string;
        timestamp: string;
        durationSeconds: number;
        isWrite: boolean;
        linesAdded: number;
        linesRemoved: number;
        machineId: string;
        editor: string;
      }
    >({
      databaseId: DB_ID,
      tableId: COLLECTIONS.heartbeats,
      queries: [Query.equal("userId", uid), Query.orderDesc("timestamp"), Query.limit(limit)],
    });
    return result.rows.map((d) => ({
      id: d.$id,
      userId: d.userId,
      projectId: d.projectId,
      projectName: d.projectName,
      entity: d.entity,
      language: d.language,
      branch: d.branch,
      category: d.category,
      timestamp: d.timestamp,
      durationSeconds: d.durationSeconds,
      isWrite: d.isWrite,
      linesAdded: d.linesAdded,
      linesRemoved: d.linesRemoved,
      machineId: d.machineId,
      editor: d.editor,
    }));
  }

  /**
   * Local aggregation from heartbeats.
   */
  static aggregate(heartbeats: Heartbeat[], tz: string): DailySummary[] {
    const day = (iso: string): string => {
      const d = new Date(iso);
      const local = new Date(d.toLocaleString("en-US", { timeZone: tz }));
      const y = local.getFullYear();
      const m = String(local.getMonth() + 1).padStart(2, "0");
      const day = String(local.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const map = new Map<string, DailySummary>();
    for (const hb of heartbeats) {
      const key = `${day(hb.timestamp)}|${hb.projectId}|${hb.language}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalSeconds += hb.durationSeconds;
        existing.linesAdded += hb.linesAdded;
        existing.linesRemoved += hb.linesRemoved;
        existing.sessions += 1;
      } else {
        const ds: DailySummary = {
          $id: key,
          $tableId: COLLECTIONS.dailySummaries,
          $databaseId: DB_ID,
          $sequence: 0,
          $createdAt: hb.timestamp,
          $updatedAt: hb.timestamp,
          $permissions: [],
          userId: hb.userId,
          date: day(hb.timestamp),
          projectId: hb.projectId,
          projectName: hb.projectName,
          language: hb.language,
          totalSeconds: hb.durationSeconds,
          linesAdded: hb.linesAdded,
          linesRemoved: hb.linesRemoved,
          sessions: 1,
        };
        map.set(key, ds);
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }
}
