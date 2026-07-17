import { Client, Account, TablesDB } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || "work-tracker";

export const client = new Client().setEndpoint(endpoint).setProject(projectId);
export const account = new Account(client);
export const tables = new TablesDB(client);
export const DB_ID = "work-tracker";

export const TABLES = {
  heartbeats: "heartbeats",
  projects: "projects",
  goals: "goals",
  apiKeys: "api_keys",
} as const;
