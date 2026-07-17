import { Client, TablesDB, Query, Models } from "appwrite";
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

const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "work-tracker";

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

export async function buildClient(cfg: { apiKey: string }): Promise<AppwriteServices> {
  if (!cfg.apiKey) {
    throw new Error("workTracker.apiKey is not set. Run 'Work Tracker: Setup API Key' first.");
  }

  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
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
