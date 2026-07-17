import * as vscode from "vscode";

export interface WorkTrackerConfig {
  apiKey: string;
  userId: string;
  trackingEnabled: boolean;
  heartbeatIntervalSeconds: number;
  keystrokeTimeoutMinutes: number;
  excludePatterns: string[];
  statusBarEnabled: boolean;
  showLinesChanged: boolean;
  hideProjectFolder: boolean;
  debug: boolean;
}

function get<T>(key: string, fallback: T): T {
  const cfg = vscode.workspace.getConfiguration("workTracker");
  const v = cfg.get<T>(key);
  return v === undefined ? fallback : v;
}

export function loadConfig(): WorkTrackerConfig {
  return {
    apiKey: get<string>("apiKey", ""),
    userId: "",
    trackingEnabled: get<boolean>("trackingEnabled", true),
    heartbeatIntervalSeconds: get<number>("heartbeatIntervalSeconds", 300),
    keystrokeTimeoutMinutes: get<number>("keystrokeTimeoutMinutes", 15),
    excludePatterns: get<string[]>("excludePatterns", []),
    statusBarEnabled: get<boolean>("statusBarEnabled", true),
    showLinesChanged: get<boolean>("showLinesChanged", true),
    hideProjectFolder: get<boolean>("hideProjectFolder", false),
    debug: get<boolean>("debug", false),
  };
}

export function onConfigChange(handler: (cfg: WorkTrackerConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("workTracker")) {
      handler(loadConfig());
    }
  });
}
