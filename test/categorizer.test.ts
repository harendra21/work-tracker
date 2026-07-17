import { describe, it, expect } from "vitest";
import { categorise } from "../src/tracker/categorizer";

describe("categorise", () => {
  it("returns coding for normal files", () => {
    expect(categorise("/repo/src/main.ts", { isDebugging: false })).toBe("coding");
  });

  it("returns debugging when debugging", () => {
    expect(categorise("/repo/src/main.ts", { isDebugging: true })).toBe("debugging");
  });

  it("returns configuring for settings.json", () => {
    expect(categorise("/repo/.vscode/settings.json", { isDebugging: false })).toBe("configuring");
  });
});
