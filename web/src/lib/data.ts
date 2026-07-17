import { tables, DB_ID, TABLES } from "./appwrite";
import { Query } from "appwrite";
import type { Heartbeat } from "../types";

function generateKey(userId: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let rand = "";
  for (let i = 0; i < 24; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Encode userId in the key so the extension can extract it without DB lookup
  return "wt_" + btoa(userId).replace(/=/g, "") + "_" + rand;
}

export async function fetchHeartbeats(
  userId: string,
  sinceISO: string,
  limit = 5000
): Promise<Heartbeat[]> {
  const res = await tables.listRows({
    databaseId: DB_ID,
    tableId: TABLES.heartbeats,
    queries: [
      Query.equal("userId", userId),
      Query.greaterThanEqual("timestamp", sinceISO),
      Query.orderDesc("timestamp"),
      Query.limit(limit),
    ],
  });
  return res.rows as unknown as Heartbeat[];
}

export async function fetchGoals(userId: string) {
  const res = await tables.listRows({
    databaseId: DB_ID,
    tableId: TABLES.goals,
    queries: [Query.equal("userId", userId), Query.orderDesc("createdAt")],
  });
  return res.rows;
}

export async function createGoal(
  userId: string,
  input: {
    title: string;
    delta: "day" | "week";
    seconds: number;
    languages?: string[];
    projects?: string[];
    isEnabled?: boolean;
  }
) {
  return tables.createRow({
    databaseId: DB_ID,
    tableId: TABLES.goals,
    rowId: "unique()",
    data: {
      userId,
      title: input.title,
      delta: input.delta,
      seconds: input.seconds,
      languages: (input.languages ?? []).join(","),
      projects: (input.projects ?? []).join(","),
      isEnabled: input.isEnabled ?? true,
      createdAt: new Date().toISOString(),
    },
  });
}

export async function updateGoal(rowId: string, data: Record<string, unknown>) {
  return tables.updateRow({
    databaseId: DB_ID,
    tableId: TABLES.goals,
    rowId,
    data,
  });
}

export async function deleteGoal(rowId: string) {
  return tables.deleteRow({
    databaseId: DB_ID,
    tableId: TABLES.goals,
    rowId,
  });
}

export async function fetchProjects(userId: string) {
  const res = await tables.listRows({
    databaseId: DB_ID,
    tableId: TABLES.projects,
    queries: [Query.equal("userId", userId), Query.orderDesc("name")],
  });
  return res.rows;
}

export async function toggleProjectTracking(rowId: string, enabled: boolean) {
  return tables.updateRow({
    databaseId: DB_ID,
    tableId: TABLES.projects,
    rowId,
    data: { trackingEnabled: enabled },
  });
}

export async function fetchApiKeys(userId: string) {
  const res = await tables.listRows({
    databaseId: DB_ID,
    tableId: TABLES.apiKeys,
    queries: [Query.equal("userId", userId)],
  });
  return res.rows;
}

export async function generateApiKey(userId: string, name: string) {
  return tables.createRow({
    databaseId: DB_ID,
    tableId: TABLES.apiKeys,
    rowId: "unique()",
    data: {
      key: generateKey(userId),
      userId,
      name: name || "VS Code Extension",
    },
  });
}

export async function deleteApiKey(rowId: string) {
  return tables.deleteRow({
    databaseId: DB_ID,
    tableId: TABLES.apiKeys,
    rowId,
  });
}
