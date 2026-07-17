/**
 * Maps a file path + activity to a WakaTime-style category.
 *
 * v1 is intentionally simple: most editor activity is "coding". Debugger
 * sessions map to "debugging", and "settings" / "keybindings" map to
 * "configuring".
 */
import * as path from "path";

const DEBUGGER_FILE = path.join(".vscode", "launch.json");
const CONFIG_GLOBS = [/settings\.json$/i, /keybindings\.json$/i];

export type Category = "coding" | "debugging" | "configuring" | "building" | "other";

export interface CategoryContext {
  isDebugging: boolean;
}

export function categorise(filePath: string, ctx: CategoryContext): Category {
  if (ctx.isDebugging) {
    return "debugging";
  }
  const base = path.basename(filePath);
  if (CONFIG_GLOBS.some((r) => r.test(base))) {
    return "configuring";
  }
  if (base === path.basename(DEBUGGER_FILE)) {
    return "debugging";
  }
  return "coding";
}
