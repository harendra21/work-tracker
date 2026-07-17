/**
 * Regex matchers for exclude patterns.
 */
import * as path from "path";

export class ExcludeMatcher {
  private readonly regexes: RegExp[];

  constructor(patterns: string[]) {
    this.regexes = patterns
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => {
        try {
          return new RegExp(p);
        } catch {
          return null;
        }
      })
      .filter((r): r is RegExp => r !== null);
  }

  matches(filePath: string): boolean {
    if (this.regexes.length === 0) {
      return false;
    }
    const normalised = filePath.replace(/\\/g, "/");
    return this.regexes.some((r) => r.test(normalised) || r.test(path.basename(normalised)));
  }
}
