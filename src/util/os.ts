/**
 * OS / machine identity helpers.
 */
import * as os from "os";
import * as crypto from "crypto";

const MACHINE_ID_FILE = "machine-id";

let cachedMachineId: string | undefined;

export function hostname(): string {
  return os.hostname();
}

export function platform(): NodeJS.Platform {
  return process.platform;
}

export function timezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Stable per-installation machine id (persisted to extension globalState).
 * Different from the OS hostname so users can rename their machine without
 * breaking the linkage of their historical data.
 */
export function machineId(globalState: {
  get: <T>(k: string) => T | undefined;
  update: (k: string, v: unknown) => Thenable<void>;
}): string {
  if (cachedMachineId) {
    return cachedMachineId;
  }
  const existing = globalState.get<string>(MACHINE_ID_FILE);
  if (existing) {
    cachedMachineId = existing;
    return existing;
  }
  const id = crypto.randomUUID();
  void globalState.update(MACHINE_ID_FILE, id);
  cachedMachineId = id;
  return id;
}
