import { describe, it, expect } from "vitest";
import { diffLines } from "../src/tracker/lineTracker";

describe("diffLines", () => {
  it("returns zero for identical text", () => {
    expect(diffLines("a\nb\nc", "a\nb\nc")).toEqual({ added: 0, removed: 0 });
  });

  it("detects added lines", () => {
    expect(diffLines("a", "a\nb\nc")).toEqual({ added: 2, removed: 0 });
  });

  it("detects removed lines", () => {
    expect(diffLines("a\nb\nc", "a")).toEqual({ added: 0, removed: 2 });
  });

  it("detects mixed changes", () => {
    const { added, removed } = diffLines("a\nb", "a\nc\nd");
    expect(added).toBe(2);
    expect(removed).toBe(1);
  });
});
