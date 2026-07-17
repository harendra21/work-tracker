/**
 * Compute the line difference between two texts (line additions / deletions).
 * Uses a simple LCS-free approach that is O(n) and good enough for heartbeat
 * granularity (one or two seconds of edits).
 */
export interface LineDiff {
  added: number;
  removed: number;
}

export function diffLines(prev: string, next: string): LineDiff {
  if (prev === next) {
    return { added: 0, removed: 0 };
  }
  const prevLines = prev.split("\n");
  const nextLines = next.split("\n");
  const prevSet = new Set(prevLines);
  const nextSet = new Set(nextLines);
  let added = 0;
  for (const line of nextLines) {
    if (!prevSet.has(line)) {
      added++;
    }
  }
  let removed = 0;
  for (const line of prevLines) {
    if (!nextSet.has(line)) {
      removed++;
    }
  }
  return { added, removed };
}
