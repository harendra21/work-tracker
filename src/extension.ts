/**
 * Activation entry point.
 */
import * as vscode from "vscode";

import { loadConfig, onConfigChange, WorkTrackerConfig } from "./config";
import * as log from "./util/logger";
import { OfflineQueue } from "./storage/offlineQueue";
import { buildClient, AppwriteServices } from "./api/appwriteClient";
import { ProjectService } from "./api/projects";
import { HeartbeatServiceImpl } from "./api/heartbeats";
import { GoalService } from "./api/goals";
import { Tracker } from "./tracker";
import { Uploader } from "./uploader";
import { DashboardPanel } from "./ui/dashboardView";
import { GoalsPanel } from "./ui/goalsView";

let dashboard: DashboardPanel | undefined;
let goalsPanel: GoalsPanel | undefined;
let tracker: Tracker | undefined;
let uploader: Uploader | undefined;
let queue: OfflineQueue | undefined;
let heartbeatService: HeartbeatServiceImpl | undefined;
let projectService: ProjectService | undefined;
let goalService: GoalService | undefined;
let config: WorkTrackerConfig;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  config = loadConfig();
  log.initLogger(config.debug);

  log.info(`activating — apiKey set: ${!!config.apiKey}, project: ${config.appwriteProjectId}`);

  const storageDir = context.globalStorageUri.fsPath;
  queue = new OfflineQueue(storageDir);

  // Build Appwrite client using the generated API key.
  let services: AppwriteServices | undefined;
  try {
    if (config.apiKey) {
      services = await buildClient(config);
      log.info(`client built — userId: ${services.userId}`);
    } else {
      log.warn("no API key configured; run 'Work Tracker: Setup API Key'");
    }
  } catch (err: any) {
    log.warn("could not build Appwrite client", err?.message ?? err);
  }

  if (services) {
    // Store userId in config for other modules
    config.appwriteUserId = services.userId;

    heartbeatService = new HeartbeatServiceImpl(services, config);
    projectService = new ProjectService(services, config);
    goalService = new GoalService(services, config);

    dashboard = new DashboardPanel(context, heartbeatService, config);
    goalsPanel = new GoalsPanel(context, goalService);

    uploader = new Uploader(queue, heartbeatService, () => {});
    uploader.start(config.heartbeatIntervalSeconds);

    tracker = new Tracker({
      config: () => config,
      projectService,
      queue,
      globalState: context.globalState,
      flushHandler: () => {
        if (uploader) {
          void uploader.tick();
        }
      },
    });
    tracker.setUser(services.userId);
    tracker.start();
    log.info("tracker started");
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.setupApiKey", async () => {
      const key = await vscode.window.showInputBox({
        prompt: "Paste your API key from the web dashboard (starts with wt_)",
        password: true,
        ignoreFocusOut: true,
      });
      if (!key) {
        return;
      }
      const trimmed = key.trim();
      const cfg = vscode.workspace.getConfiguration("workTracker");
      await cfg.update("apiKey", trimmed, vscode.ConfigurationTarget.Global);
      const choice = await vscode.window.showInformationMessage(
        "Work Tracker: API key saved. Reload window to activate?",
        "Reload Now",
        "Later"
      );
      if (choice === "Reload Now") {
        await vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.clearApiKey", async () => {
      const cfg = vscode.workspace.getConfiguration("workTracker");
      await cfg.update("apiKey", "", vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        "Work Tracker: API key cleared. Run 'Work Tracker: Setup API Key' to set a new one."
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.dashboard", () => {
      if (!config.apiKey) {
        vscode.window.showInformationMessage("Run 'Work Tracker: Setup API Key' first.");
        return;
      }
      dashboard?.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.goals", () => {
      if (!config.apiKey) {
        vscode.window.showInformationMessage("Run 'Work Tracker: Setup API Key' first.");
        return;
      }
      goalsPanel?.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.toggleTracking", () => {
      const cfg = vscode.workspace.getConfiguration("workTracker");
      const next = !cfg.get<boolean>("trackingEnabled", true);
      void cfg.update("trackingEnabled", next, vscode.ConfigurationTarget.Global);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.flushNow", async () => {
      if (!uploader) {
        return;
      }
      const n = await uploader.flushNow();
      vscode.window.showInformationMessage(`Work Tracker: flushed ${n} heartbeat(s)`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.status", () => {
      const q = queue?.pendingCount() ?? 0;
      const uid = config.appwriteUserId || "not configured";
      log.show();
      log.info(`user: ${uid} · queued: ${q} · tracking: ${config.trackingEnabled}`);
      vscode.window.showInformationMessage(
        `Work Tracker: ${uid}. ${q} heartbeat(s) queued. Tracking: ${
          config.trackingEnabled ? "ON" : "OFF"
        }.`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("workTracker.getQueueSize", () => {
      return queue?.pendingCount() ?? 0;
    })
  );

  // Settings changes
  context.subscriptions.push(
    onConfigChange((cfg) => {
      config = cfg;
      log.setDebug(cfg.debug);
      if (uploader) {
        uploader.start(cfg.heartbeatIntervalSeconds);
      }
      if (tracker && !cfg.trackingEnabled) {
        tracker.flushActive();
      }
    })
  );

  log.info("extension activated");
}

export function deactivate(): void {
  tracker?.stop();
  tracker?.flushActive();
  uploader?.stop();
  queue?.close();
  log.dispose();
}
