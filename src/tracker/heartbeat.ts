/**
 * A heartbeat represents a contiguous span of coding activity on a single
 * file. Batches of these are flushed to Appwrite.
 */
export interface Heartbeat {
  /** Stable id (UUID v4) so retries are idempotent. */
  id: string;
  /** Authenticated user id (Appwrite). */
  userId: string;
  /** Resolved project id (Appwrite document id in `projects`). */
  projectId: string;
  /** Project name as the user sees it. */
  projectName: string;
  /** File path (absolute, or relative when `hideProjectFolder` is on). */
  entity: string;
  /** Detected language, e.g. "TypeScript". */
  language: string;
  /** Git branch if known, else empty string. */
  branch: string;
  /** Category: "coding" | "debugging" | "building" | "browsing" | ... */
  category: string;
  /** ISO 8601 start timestamp. */
  timestamp: string;
  /** Duration of this heartbeat in seconds. */
  durationSeconds: number;
  /** Whether the file was saved during this span. */
  isWrite: boolean;
  /** Lines added since previous heartbeat for this file (optional). */
  linesAdded: number;
  /** Lines removed since previous heartbeat for this file (optional). */
  linesRemoved: number;
  /** Stable machine id. */
  machineId: string;
  /** Editor name (e.g. "VS Code"). */
  editor: string;
}

export type NewHeartbeat = Omit<Heartbeat, "id"> & { id?: string };
