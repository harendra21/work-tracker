/**
 * The Tracker is the heart of the extension. It observes editor activity,
 * rolls it up into session spans, and emits heartbeat events.
 *
 *   text change (debounced) ─┐
 *   active editor changed  ──┤
 *   file saved             ──┼─→ SessionAccumulator → Heartbeat batch
 *   window state changed   ──┤
 *   focus changed          ──┘
 */
import * as vscode from "vscode";
import { v4 as uuid } from "uuid";
import * as path from "path";

import { WorkTrackerConfig } from "./config";
import { Heartbeat } from "./tracker/heartbeat";
import { ExcludeMatcher } from "./util/matcher";
import { detectProject } from "./tracker/projectDetector";
import { detectLanguage } from "./tracker/languageDetector";
import { categorise } from "./tracker/categorizer";
import { debounce as _debounce } from "./tracker/debounce";
import { diffLines } from "./tracker/lineTracker";
import { machineId, hostname as _hostname } from "./util/os";
import * as log from "./util/logger";

import { ProjectService } from "./api/projects";
import { OfflineQueue } from "./storage/offlineQueue";

// If the user is idle for more than this, the next activity starts a NEW session
// (not appended to the old one). Prevents 10-minute idle gaps from inflating
// coding time.
const IDLE_SPLIT_MS = 2 * 60 * 1000; // 2 minutes

// Max wall-clock duration for a single heartbeat. If a session somehow runs
// longer (e.g. constant typing), cap it so heartbeats stay bounded.
const MAX_HEARTBEAT_SECONDS = 15 * 60;

export interface TrackerDeps {
  config: () => WorkTrackerConfig;
  projectService: ProjectService;
  queue: OfflineQueue;
  globalState: vscode.Memento;
  flushHandler: () => void;
}

interface ActiveSession {
  document: vscode.TextDocument;
  startedAt: number;
  lastTouchedAt: number;
  prevText: string;
  isWrite: boolean;
  linesAdded: number;
  linesRemoved: number;
  // Active time accumulator (seconds of actual activity, not wall-clock)
  activeSeconds: number;
  // Last time we accumulated activity (used to compute delta on each event)
  lastTickAt: number;
}

export class Tracker {
  private disposables: vscode.Disposable[] = [];
  private matcher: ExcludeMatcher;
  private active: ActiveSession | undefined;
  private currentUserId: string | undefined;
  private currentProjectId: string | undefined;
  private currentProjectName = "";
  private currentBranch = "";
  private isDebugging = false;
  private lastFlushAt = 0;

  constructor(private readonly deps: TrackerDeps) {
    this.matcher = new ExcludeMatcher(deps.config().excludePatterns);
  }

  setUser(userId: string | undefined): void {
    this.currentUserId = userId;
  }

  isActive(): boolean {
    return this.active !== undefined;
  }

  start(): void {
    const cfg = this.deps.config();
    if (!cfg.trackingEnabled) {
      log.info("tracking disabled in settings; not starting observers");
      return;
    }
    this.matcher = new ExcludeMatcher(cfg.excludePatterns);

    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => this.onTextChange(e)),
      vscode.window.onDidChangeTextEditorSelection((e) => this.onSelectionChange(e)),
      vscode.window.onDidChangeActiveTextEditor((e) => this.onEditorChange(e)),
      vscode.workspace.onDidSaveTextDocument((doc) => this.onSave(doc)),
      vscode.window.onDidChangeWindowState((s) => this.onWindowState(s)),
      vscode.debug.onDidChangeActiveDebugSession(() => this.onDebugChange()),
      vscode.debug.onDidTerminateDebugSession(() => this.onDebugChange()),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("workTracker.excludePatterns")) {
          this.matcher = new ExcludeMatcher(this.deps.config().excludePatterns);
        }
      })
    );

    // Periodic flush check
    const intervalMs = Math.max(30, this.deps.config().heartbeatIntervalSeconds) * 1000;
    const timer = setInterval(() => this.periodicCheck(intervalMs), intervalMs);
    this.disposables.push(new vscode.Disposable(() => clearInterval(timer)));

    // Initial editor
    if (vscode.window.activeTextEditor) {
      void this.onEditorChange(vscode.window.activeTextEditor);
    }
  }

  stop(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }

  /**
   * Manually force a flush of the active session (called on file close,
   * save, window blur, or via the Flush command).
   */
  flushActive(): void {
    if (!this.active) {
      return;
    }
    this.flushSession();
  }

  // -- private --

  private onTextChange(e: vscode.TextDocumentChangeEvent): void {
    const doc = e.document;
    if (!this.active || this.active.document.uri.toString() !== doc.uri.toString()) {
      return;
    }
    if (this.matcher.matches(doc.uri.fsPath)) {
      return;
    }
    this.touchActive();
    if (!this.deps.config().showLinesChanged) {
      this.active.lastTouchedAt = Date.now();
      return;
    }
    let added = 0;
    let removed = 0;
    for (const change of e.contentChanges) {
      const prev = change.text;
      const nextText = this.active.prevText;
      const d = diffLines(prev, nextText);
      added += d.added;
      removed += d.removed;
    }
    this.active.linesAdded += added;
    this.active.linesRemoved += removed;
    this.active.lastTouchedAt = Date.now();
  }

  /**
   * Mark the user as active "now" and accumulate active time since the last
   * tick, capped so a long idle doesn't count as active time.
   */
  private touchActive(): void {
    if (!this.active) return;
    const now = Date.now();
    const gap = now - this.active.lastTickAt;
    // Only count up to IDLE_SPLIT_MS of activity in one chunk. If the user
    // was away longer, treat the next event as the start of a new session.
    if (gap > IDLE_SPLIT_MS) {
      this.active.startedAt = now;
      this.active.lastTouchedAt = now;
      this.active.activeSeconds = 0;
      this.active.linesAdded = 0;
      this.active.linesRemoved = 0;
      this.active.isWrite = false;
    } else if (gap > 0) {
      // Count up to IDLE_SPLIT_MS but never more, so a single 10-min gap
      // after a quick edit doesn't bloat the duration.
      this.active.activeSeconds += Math.min(gap, IDLE_SPLIT_MS) / 1000;
    }
    this.active.lastTickAt = now;
    this.active.lastTouchedAt = now;
  }

  private async onEditorChange(editor: vscode.TextEditor | undefined): Promise<void> {
    this.flushActive();
    if (!editor) {
      this.active = undefined;
      return;
    }
    const doc = editor.document;
    if (doc.uri.scheme !== "file") {
      this.active = undefined;
      return;
    }
    if (this.matcher.matches(doc.uri.fsPath)) {
      log.debug(`excluded by pattern: ${doc.uri.fsPath}`);
      this.active = undefined;
      return;
    }
    const cfg = this.deps.config();
    if (!cfg.trackingEnabled) {
      return;
    }
    const project = detectProject(doc.uri);
    if (!project) {
      log.debug(`no project detected for ${doc.uri.fsPath}`);
      this.active = undefined;
      return;
    }
    if (!this.currentUserId) {
      log.debug("no user signed in; not tracking");
      this.active = undefined;
      return;
    }
    try {
      const projectId = await this.deps.projectService.resolveId(project.name, project.folder);
      // Check if tracking is enabled for this project
      const trackingEnabled = await this.deps.projectService.isTrackingEnabled(projectId);
      if (!trackingEnabled) {
        log.debug(`tracking disabled for project ${project.name}; skipping`);
        this.active = undefined;
        return;
      }
      this.currentProjectId = projectId;
      this.currentProjectName = project.name;
      this.currentBranch = project.branch;
    } catch (err) {
      log.warn("failed to resolve project", err);
      return;
    }
    const text = doc.getText();
    const now = Date.now();
    this.active = {
      document: doc,
      startedAt: now,
      lastTouchedAt: now,
      prevText: text,
      isWrite: false,
      linesAdded: 0,
      linesRemoved: 0,
      activeSeconds: 0,
      lastTickAt: now,
    };
  }

  private onSave(doc: vscode.TextDocument): void {
    if (this.active && this.active.document.uri.toString() === doc.uri.toString()) {
      this.active.isWrite = true;
      this.active.lastTouchedAt = Date.now();
      this.touchActive();
      // Save is a strong flush signal
      this.flushActive();
      // Re-open session
      const now = Date.now();
      this.active = {
        document: doc,
        startedAt: now,
        lastTouchedAt: now,
        prevText: doc.getText(),
        isWrite: false,
        linesAdded: 0,
        linesRemoved: 0,
        activeSeconds: 0,
        lastTickAt: now,
      };
    }
  }

  private onWindowState(state: vscode.WindowState): void {
    if (!state.focused) {
      this.flushActive();
    }
  }

  /**
   * Selection/cursor moves also count as active. Without this, just
   * navigating around a file wouldn't register any time.
   */
  private onSelectionChange(e: vscode.TextEditorSelectionChangeEvent): void {
    if (!this.active) return;
    if (this.active.document.uri.toString() !== e.textEditor.document.uri.toString()) {
      return;
    }
    this.touchActive();
  }

  private onDebugChange(): void {
    this.isDebugging = vscode.debug.activeDebugSession !== undefined;
  }

  private periodicCheck(intervalMs: number): void {
    const cfg = this.deps.config();
    if (!cfg.trackingEnabled) {
      this.flushActive();
      this.active = undefined;
      return;
    }
    if (this.active) {
      const idleMs = cfg.keystrokeTimeoutMinutes * 60 * 1000;
      const now = Date.now();
      if (now - this.active.lastTouchedAt > idleMs) {
        log.debug("idle timeout; closing session");
        this.flushActive();
        this.active = undefined;
      } else {
        // Accumulate the "background" time as long as the user is still
        // considered active (within keystrokeTimeoutMinutes of the last
        // event). Capped at IDLE_SPLIT_MS per tick so a long unbroken
        // stretch doesn't blow up the duration.
        const gap = now - this.active.lastTickAt;
        if (gap > 0 && gap < idleMs) {
          this.active.activeSeconds += Math.min(gap, IDLE_SPLIT_MS) / 1000;
        }
        if (now - this.lastFlushAt > intervalMs) {
          this.flushActive();
        }
      }
    }
  }

  private flushSession(): void {
    if (!this.active || !this.currentUserId || !this.currentProjectId) {
      return;
    }
    // Account for the time since the last tick up to "now" (capped at
    // IDLE_SPLIT_MS) so the very last moment of activity is included.
    const now = Date.now();
    const gap = now - this.active.lastTickAt;
    if (gap > 0 && gap < IDLE_SPLIT_MS) {
      this.active.activeSeconds += gap / 1000;
    }
    this.active.lastTickAt = now;

    const startedAt = this.active.startedAt;
    const wallDuration = Math.max(0, (now - startedAt) / 1000);
    // Use the active-time accumulator for the recorded duration. This is the
    // real coding time, not the wall-clock gap (which inflates on idle).
    let duration = this.active.activeSeconds;
    // Sanity cap: never record a single heartbeat longer than the cap.
    if (duration > MAX_HEARTBEAT_SECONDS) {
      duration = MAX_HEARTBEAT_SECONDS;
    }
    if (duration < 1) {
      // Sub-second sessions aren't worth recording
      return;
    }
    void wallDuration; // not used; kept for future debug
    const cfg = this.deps.config();
    const projectFolder = path.dirname(this.active.document.uri.fsPath);
    const entity = cfg.hideProjectFolder
      ? path.relative(this.currentProjectName, this.active.document.uri.fsPath) ||
        path.basename(this.active.document.uri.fsPath)
      : this.active.document.uri.fsPath;
    void projectFolder; // reserved for future use
    const hb: Heartbeat = {
      id: uuid(),
      userId: this.currentUserId,
      projectId: this.currentProjectId,
      projectName: this.currentProjectName,
      entity,
      language: detectLanguage(this.active.document.uri.fsPath),
      branch: this.currentBranch,
      category: categorise(this.active.document.uri.fsPath, { isDebugging: this.isDebugging }),
      timestamp: new Date(startedAt).toISOString(),
      durationSeconds: Math.round(duration * 10) / 10,
      isWrite: this.active.isWrite,
      linesAdded: this.active.linesAdded,
      linesRemoved: this.active.linesRemoved,
      machineId: machineId(this.deps.globalState),
      editor: `VS Code ${vscode.version}`,
    };
    this.deps.queue.enqueue(hb);
    log.debug(
      `queued heartbeat: ${hb.projectName} ${hb.entity} ${hb.durationSeconds.toFixed(1)}s ` +
        `(active=${this.active.activeSeconds.toFixed(1)}s)`
    );
    this.lastFlushAt = Date.now();
    // Reset the active accumulator so the next flush measures from here.
    this.active.activeSeconds = 0;
    this.active.startedAt = now;
    this.active.lastTickAt = now;
    this.active.linesAdded = 0;
    this.active.linesRemoved = 0;
    this.active.isWrite = false;
    this.deps.flushHandler();
  }
}
