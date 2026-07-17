/**
 * Goals CRUD.
 */
import { AppwriteServices, COLLECTIONS, DB_ID } from "./appwriteClient";
import { Query, Models, ID } from "appwrite";
import { WorkTrackerConfig } from "../config";
import * as log from "../util/logger";

export interface Goal extends Models.Row {
  userId: string;
  title: string;
  delta: "day" | "week";
  seconds: number;
  languages: string[];
  projects: string[];
  isEnabled: boolean;
  createdAt: string;
}

export class GoalService {
  constructor(
    private readonly svcs: AppwriteServices,
    private readonly config: WorkTrackerConfig
  ) {}

  private get userId(): string | undefined {
    return this.config.userId || undefined;
  }

  async list(): Promise<Goal[]> {
    const uid = this.userId;
    if (!uid) {
      return [];
    }
    const res = await this.svcs.tables.listRows<Goal>({
      databaseId: DB_ID,
      tableId: COLLECTIONS.goals,
      queries: [Query.equal("userId", uid), Query.orderDesc("createdAt")],
    });
    return res.rows;
  }

  async create(
    input: Omit<
      Goal,
      | "$id"
      | "$tableId"
      | "$databaseId"
      | "$sequence"
      | "$createdAt"
      | "$updatedAt"
      | "$permissions"
      | "userId"
      | "createdAt"
    >
  ): Promise<Goal> {
    const uid = this.userId;
    if (!uid) {
      throw new Error("not configured: no user ID");
    }
    const doc = await this.svcs.tables.createRow<Goal>({
      databaseId: DB_ID,
      tableId: COLLECTIONS.goals,
      rowId: ID.unique(),
      data: {
        ...input,
        userId: uid,
        createdAt: new Date().toISOString(),
      },
    });
    log.info(`goal created: ${doc.title}`);
    return doc;
  }

  async update(id: string, patch: Partial<Goal>): Promise<Goal> {
    const doc = await this.svcs.tables.updateRow<Goal>({
      databaseId: DB_ID,
      tableId: COLLECTIONS.goals,
      rowId: id,
      data: patch,
    });
    return doc;
  }

  async delete(id: string): Promise<void> {
    await this.svcs.tables.deleteRow({
      databaseId: DB_ID,
      tableId: COLLECTIONS.goals,
      rowId: id,
    });
  }
}
