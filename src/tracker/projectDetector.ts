/**
 * Project detection.
 *
 * Strategy:
 *  1. Find the workspace folder for the file.
 *  2. If the folder contains `.worktracker-project`, use its first line as
 *     the project name.
 *  3. Otherwise, use the git repo name (folder containing `.git`) if any.
 *  4. Otherwise, use the workspace folder name.
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const MARKER = ".worktracker-project";

export interface ProjectInfo {
  name: string;
  folder: string;
  branch: string;
}

export function detectProject(uri: vscode.Uri): ProjectInfo | undefined {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    return undefined;
  }
  const folder = workspaceFolder.uri.fsPath;
  const gitRoot = findGitRoot(folder) ?? folder;
  const name = readProjectName(gitRoot) ?? path.basename(gitRoot);
  const branch = readGitBranch(gitRoot);
  return { name, folder: gitRoot, branch };
}

function findGitRoot(start: string): string | undefined {
  let cur = start;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(cur, ".git"))) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) {
      return undefined;
    }
    cur = parent;
  }
  return undefined;
}

function readProjectName(root: string): string | undefined {
  const marker = path.join(root, MARKER);
  try {
    if (fs.existsSync(marker)) {
      const text = fs.readFileSync(marker, "utf8").trim();
      if (text) {
        return text.split("\n")[0].trim();
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

function readGitBranch(root: string): string {
  const headFile = path.join(root, ".git", "HEAD");
  try {
    if (fs.existsSync(headFile)) {
      const head = fs.readFileSync(headFile, "utf8").trim();
      const m = head.match(/^ref:\s*refs\/heads\/(.+)$/);
      if (m) {
        return m[1];
      }
    }
  } catch {
    // ignore
  }
  return "";
}
