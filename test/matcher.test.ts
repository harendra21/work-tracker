import { describe, it, expect } from "vitest";
import { ExcludeMatcher } from "../src/util/matcher";

describe("ExcludeMatcher", () => {
  it("matches against full path", () => {
    const m = new ExcludeMatcher(["/secrets/"]);
    expect(m.matches("/Users/me/secrets/keys.txt")).toBe(true);
  });

  it("matches against basename", () => {
    const m = new ExcludeMatcher([".env$"]);
    expect(m.matches("/repo/.env")).toBe(true);
  });

  it("ignores invalid patterns", () => {
    const m = new ExcludeMatcher(["[unclosed"]);
    expect(m.matches("/repo/main.ts")).toBe(false);
  });

  it("returns false when no patterns", () => {
    const m = new ExcludeMatcher([]);
    expect(m.matches("/repo/main.ts")).toBe(false);
  });
});
