/**
 * Appwrite client wrapper.
 * The API key is the row ID of a row in the api_keys table.
 * We look up that row to get the userId.
 */
import { Client, TablesDB, Query, Models } from "appwrite";
import { WorkTrackerConfig } from "../config";
import * as log from "../util/logger";

export interface AppwriteServices {
  client: Client;
  tables: TablesDB;
  userId: string;
}

interface ApiKeyRow extends Models.Row {
  key: string;
  userId: string;
  name: string;
}

/**
 * Look up userId from the api_keys table using the key value.
 * The web dashboard stores keys in the api_keys table; the key value IS the identifier.
 */
async function lookupUserId(
  services: { tables: TablesDB },
  apiKey: string
): Promise<string | null> {
  try {
    const result = await services.tables.listRows<ApiKeyRow>({
      databaseId: "work-tracker",
      tableId: "api_keys",
      queries: [Query.equal("key", apiKey), Query.limit(1)],
    });
    if (result.rows.length === 0) {
      log.warn(`no api_key row found for key starting with "${apiKey.substring(0, 15)}..."`);
      return null;
    }
    const row = result.rows[0];
    log.info(`found api_key row: userId=${row.userId}, name=${row.name}`);
    return row.userId;
  } catch (e) {
    log.warn(`failed to look up api_key: ${e}`);
    return null;
  }
}

/**
 * Build an authenticated client using the generated API key.
 * The key is looked up in the api_keys table to find the userId.
 */
export async function buildClient(cfg: WorkTrackerConfig): Promise<AppwriteServices> {
  if (!cfg.appwriteProjectId) {
    throw new Error("workTracker.appwriteProjectId is not set.");
  }
  if (!cfg.apiKey) {
    throw new Error("workTracker.apiKey is not set. Run 'Work Tracker: Setup API Key' first.");
  }

  const client = new Client().setEndpoint(cfg.appwriteEndpoint).setProject(cfg.appwriteProjectId);
  const tables = new TablesDB(client);
  const services = { client, tables };

  const userId = await lookupUserId(services, cfg.apiKey);
  if (!userId) {
    throw new Error("Invalid API key. Generate a new one from the web dashboard.");
  }

  return { ...services, userId };
}

export const COLLECTIONS = {
  projects: "projects",
  heartbeats: "heartbeats",
  dailySummaries: "daily_summaries",
  goals: "goals",
  apiKeys: "api_keys",
} as const;

export const DB_ID = "work-tracker";
