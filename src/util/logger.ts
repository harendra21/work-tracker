/**
 * Lightweight logger. Writes to a named Output Channel so users can view
 * extension activity via View → Output → Work Tracker.
 */
import * as vscode from "vscode";

let channel: vscode.OutputChannel | undefined;
let debugEnabled = false;

export function initLogger(debug: boolean): void {
  debugEnabled = debug;
  if (!channel) {
    channel = vscode.window.createOutputChannel("Work Tracker");
  }
}

export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

function write(level: string, msg: string): void {
  if (!channel) {
    channel = vscode.window.createOutputChannel("Work Tracker");
  }
  const ts = new Date().toISOString();
  channel.appendLine(`[${ts}] [${level}] ${msg}`);
}

export function info(msg: string): void {
  write("INFO", msg);
}

export function warn(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? `: ${err.message}` : err ? `: ${String(err)}` : "";
  write("WARN", msg + detail);
}

export function error(msg: string, err?: unknown): void {
  const detail = err instanceof Error ? `: ${err.message}` : err ? `: ${String(err)}` : "";
  write("ERROR", msg + detail);
  void detail; // suppress unused
}

export function debug(msg: string): void {
  if (debugEnabled) {
    write("DEBUG", msg);
  }
}

export function show(): void {
  channel?.show();
}

export function dispose(): void {
  channel?.dispose();
  channel = undefined;
}
