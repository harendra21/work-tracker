import { describe, it, expect } from "vitest";
import { debounce } from "../src/tracker/debounce";
import { formatDuration, formatTodayLabel } from "../src/util/time";

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(5)).toBe("5s");
    expect(formatDuration(59)).toBe("59s");
  });
  it("formats minutes", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(125)).toBe("2m 5s");
  });
  it("formats hours", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3660)).toBe("1h 1m");
  });
  it("formats days", () => {
    expect(formatDuration(86400)).toBe("1d");
    expect(formatDuration(90000)).toBe("1d 1h");
  });
  it("clamps negative / non-finite to 0s", () => {
    expect(formatDuration(-1)).toBe("0s");
    expect(formatDuration(NaN)).toBe("0s");
  });
});

describe("formatTodayLabel", () => {
  it("returns an ISO date", () => {
    expect(formatTodayLabel()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("debounce", () => {
  it("debounces multiple calls", async () => {
    let calls = 0;
    const fn = debounce(() => {
      calls++;
    }, 10);
    fn();
    fn();
    fn();
    await new Promise((r) => setTimeout(r, 30));
    expect(calls).toBe(1);
  });
  it("flush executes immediately", () => {
    let calls = 0;
    const fn = debounce(() => {
      calls++;
    }, 10_000);
    fn();
    fn.flush();
    expect(calls).toBe(1);
  });
});
