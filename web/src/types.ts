export interface Heartbeat {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
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

export interface Goal {
  $id: string;
  $createdAt: string;
  userId: string;
  title: string;
  targetSeconds: number;
  period: "daily" | "weekly";
  createdAt: string;
}

export interface Project {
  $id: string;
  userId: string;
  name: string;
  path: string;
  color: string;
  isHidden: boolean;
  isArchived: boolean;
  trackingEnabled: boolean;
}

export interface AggregatedDay {
  date: string;
  seconds: number;
}

export interface AggregatedItem {
  name: string;
  seconds: number;
  color?: string;
  linesAdded?: number;
  linesRemoved?: number;
}

export interface HourlyHeatmap {
  day: number;
  hour: number;
  seconds: number;
}

export interface AggregatedFile {
  name: string;
  fullPath: string;
  language: string;
  seconds: number;
  sessions: number;
  linesAdded: number;
  linesRemoved: number;
  pct: number;
}

export type Range = "today" | "7d" | "30d" | "90d" | "custom";

export interface ApiKey {
  $id: string;
  key: string;
  userId: string;
  name: string;
}
