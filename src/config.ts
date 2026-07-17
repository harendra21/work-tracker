/**
 * Centralised configuration loaded from VS Code settings.
 */
import * as vscode from "vscode";

export interface WorkTrackerConfig {
  appwriteEndpoint: string;
  appwriteProjectId: string;
  appwriteApiKey: string;
  appwriteUserId: string;
  apiKey: string;
  trackingEnabled: boolean;
  heartbeatIntervalSeconds: number;
  keystrokeTimeoutMinutes: number;
  excludePatterns: string[];
  statusBarEnabled: boolean;
  showLinesChanged: boolean;
  hideProjectFolder: boolean;
  debug: boolean;
}

const DEFAULTS: WorkTrackerConfig = {
  appwriteEndpoint: "https://cloud.appwrite.io/v1",
  appwriteProjectId: "work-tracker",
  appwriteApiKey: "",
  appwriteUserId: "",
  apiKey: "",
  trackingEnabled: true,
  heartbeatIntervalSeconds: 300,
  keystrokeTimeoutMinutes: 15,
  excludePatterns: [],
  statusBarEnabled: true,
  showLinesChanged: true,
  hideProjectFolder: false,
  debug: false,
};

function get<T>(key: string, fallback: T): T {
  const cfg = vscode.workspace.getConfiguration("workTracker");
  const v = cfg.get<T>(key);
  return v === undefined ? fallback : v;
}

export function loadConfig(): WorkTrackerConfig {
  return {
    appwriteEndpoint: get<string>("appwriteEndpoint", DEFAULTS.appwriteEndpoint),
    appwriteProjectId: get<string>("appwriteProjectId", DEFAULTS.appwriteProjectId),
    appwriteApiKey: get<string>("appwriteApiKey", DEFAULTS.appwriteApiKey),
    appwriteUserId: get<string>("appwriteUserId", DEFAULTS.appwriteUserId),
    apiKey: get<string>("apiKey", DEFAULTS.apiKey),
    trackingEnabled: get<boolean>("trackingEnabled", DEFAULTS.trackingEnabled),
    heartbeatIntervalSeconds: get<number>(
      "heartbeatIntervalSeconds",
      DEFAULTS.heartbeatIntervalSeconds
    ),
    keystrokeTimeoutMinutes: get<number>(
      "keystrokeTimeoutMinutes",
      DEFAULTS.keystrokeTimeoutMinutes
    ),
    excludePatterns: get<string[]>("excludePatterns", DEFAULTS.excludePatterns),
    statusBarEnabled: get<boolean>("statusBarEnabled", DEFAULTS.statusBarEnabled),
    showLinesChanged: get<boolean>("showLinesChanged", DEFAULTS.showLinesChanged),
    hideProjectFolder: get<boolean>("hideProjectFolder", DEFAULTS.hideProjectFolder),
    debug: get<boolean>("debug", DEFAULTS.debug),
  };
}

export function onConfigChange(handler: (cfg: WorkTrackerConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("workTracker")) {
      handler(loadConfig());
    }
  });
}
