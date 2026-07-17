/**
 * Project CRUD: lazily create / look up project rows.
 */
import { AppwriteServices, COLLECTIONS, DB_ID } from "./appwriteClient";
import { Query, ID, Models } from "appwrite";
import { WorkTrackerConfig } from "../config";
import * as log from "../util/logger";

export interface ProjectRecord extends Models.Row {
  userId: string;
  name: string;
  path: string;
  color: string;
  isHidden: boolean;
  isArchived: boolean;
  trackingEnabled: boolean;
}

const DEFAULT_COLORS = [
  "#2D7DD2",
  "#5C9EAD",
  "#9CDB89",
  "#E0B450",
  "#C84B31",
  "#8E44AD",
  "#16A085",
  "#D35400",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickColor(name: string): string {
  return DEFAULT_COLORS[hashString(name) % DEFAULT_COLORS.length];
}

export class ProjectService {
  private cache = new Map<string, string>(); // name -> rowId
  private inflight = new Map<string, Promise<string>>();
  private trackingCache = new Map<string, boolean>(); // projectId -> trackingEnabled

  constructor(
    private readonly svcs: AppwriteServices,
    private readonly config: WorkTrackerConfig
  ) {}

  get userId(): string | undefined {
    return this.config.userId || undefined;
  }

  /**
   * Return the Appwrite project row id, creating it on first use.
   */
  async resolveId(name: string, folder: string): Promise<string> {
    const cached = this.cache.get(name);
    if (cached) {
      return cached;
    }
    const inflight = this.inflight.get(name);
    if (inflight) {
      return inflight;
    }
    const promise = this.findOrCreate(name, folder).finally(() => {
      this.inflight.delete(name);
    });
    this.inflight.set(name, promise);
    return promise;
  }

  /**
   * Check if tracking is enabled for a project (cached for 30s).
   */
  async isTrackingEnabled(projectId: string): Promise<boolean> {
    const cached = this.trackingCache.get(projectId);
    if (cached !== undefined) {
      return cached;
    }
    try {
      const row = await this.svcs.tables.getRow<ProjectRecord>({
        databaseId: DB_ID,
        tableId: COLLECTIONS.projects,
        rowId: projectId,
      });
      const enabled = row.trackingEnabled !== false; // default true
      this.trackingCache.set(projectId, enabled);
      // Expire cache after 30s
      setTimeout(() => this.trackingCache.delete(projectId), 30_000);
      return enabled;
    } catch {
      return true; // default to enabled if we can't check
    }
  }

  private async findOrCreate(name: string, folder: string): Promise<string> {
    const uid = this.userId;
    if (!uid) {
      throw new Error("cannot resolve project: no user ID configured");
    }
    const existing = await this.svcs.tables.listRows<ProjectRecord>({
      databaseId: DB_ID,
      tableId: COLLECTIONS.projects,
      queries: [Query.equal("userId", uid), Query.equal("name", name), Query.limit(1)],
    });
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      this.cache.set(name, row.$id);
      return row.$id;
    }
    const created = await this.svcs.tables.createRow<ProjectRecord>({
      databaseId: DB_ID,
      tableId: COLLECTIONS.projects,
      rowId: ID.unique(),
      data: {
        userId: uid,
        name,
        path: folder,
        color: pickColor(name),
        isHidden: false,
        isArchived: false,
        trackingEnabled: true,
      },
    });
    this.cache.set(name, created.$id);
    log.debug(`created project ${name} -> ${created.$id}`);
    return created.$id;
  }
}
