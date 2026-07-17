import type { Models } from "appwrite";

export function getUserTimezone(user?: Models.User<Models.Preferences> | null): string {
  const prefs = user?.prefs as Record<string, unknown> | undefined;
  if (prefs?.timezone && typeof prefs.timezone === "string") return prefs.timezone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getTzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    timeZoneName: "longOffset",
  }).formatToParts(date);

  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "";
  if (!tzName.startsWith("GMT")) return 0;

  const offset = tzName.replace("GMT", "");
  if (!offset) return 0;

  const sign = offset[0] === "+" ? 1 : -1;
  const [h, m] = offset.slice(1).split(":").map(Number);
  return sign * (h * 3600000 + (m || 0) * 60000);
}
