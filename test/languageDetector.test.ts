import { describe, it, expect } from "vitest";
import { detectLanguage } from "../src/tracker/languageDetector";

describe("detectLanguage", () => {
  it("recognises common languages", () => {
    expect(detectLanguage("foo.ts")).toBe("TypeScript");
    expect(detectLanguage("foo.tsx")).toBe("TypeScript");
    expect(detectLanguage("foo.py")).toBe("Python");
    expect(detectLanguage("foo.go")).toBe("Go");
    expect(detectLanguage("foo.rs")).toBe("Rust");
    expect(detectLanguage("Foo.JS")).toBe("JavaScript");
  });

  it("returns Text for unknown extensions", () => {
    expect(detectLanguage("foo.xyz")).toBe("Text");
  });

  it("handles no extension", () => {
    expect(detectLanguage("Makefile")).toBe("Text");
  });
});
