import { useState, useMemo, useRef, useEffect } from "react";
import type { Models } from "appwrite";
import { account } from "../lib/appwrite";
import { clearCachedUser, signOut as appwriteSignOut } from "../lib/auth";
import { getUserTimezone, getTzOffsetMs } from "../lib/timezone";
import ApiKeySetup from "../components/ApiKeySetup";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Johannesburg",
];

export default function Settings({
  user,
  onSignOut,
  onUserUpdate,
}: {
  user: Models.User<Models.Preferences>;
  onSignOut: () => void;
  onUserUpdate?: (u: Models.User<Models.Preferences>) => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [timezone, setTimezone] = useState(getUserTimezone(user));
  const [tzSearch, setTzSearch] = useState("");
  const [tzOpen, setTzOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTz, setSavingTz] = useState(false);
  const [msg, setMsg] = useState("");
  const [tzMsg, setTzMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) setTzOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const offsetLabel = (tz: string): string => {
    if (tz === "UTC") return "UTC";
    const ms = getTzOffsetMs(new Date(), tz);
    const totalMin = Math.round(ms / 60000);
    const sign = totalMin >= 0 ? "+" : "";
    const h = Math.floor(Math.abs(totalMin) / 60);
    const m = Math.abs(totalMin) % 60;
    return `(GMT${sign}${h}:${String(m).padStart(2, "0")})`;
  };

  const filteredTz = useMemo(() => {
    if (!tzSearch) return TIMEZONES;
    const q = tzSearch.toLowerCase();
    return TIMEZONES.filter(
      (tz) => tz.toLowerCase().includes(q) || offsetLabel(tz).toLowerCase().includes(q)
    );
  }, [tzSearch]);

  const updateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await account.updateName(name);
      setMsg("Name updated");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const updateTimezone = async (tz: string) => {
    setTimezone(tz);
    setSavingTz(true);
    setTzMsg("");
    try {
      await account.updatePrefs({ ...user.prefs, timezone: tz });
      setTzMsg("Timezone saved");
      if (onUserUpdate) {
        const updated = await account.get();
        onUserUpdate(updated);
      }
    } catch (err) {
      setTzMsg(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingTz(false);
    }
  };

  const signOut = async () => {
    await appwriteSignOut();
    onSignOut();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold">Settings</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium mb-3">Profile</h3>
        <form onSubmit={updateName} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </form>
        {msg && <p className="text-sm text-accent mt-2">{msg}</p>}
        <p className="text-sm text-gray-500 mt-2">{user.email}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium mb-3">Time Zone</h3>
        <p className="text-xs text-gray-500 mb-3">
          Used for goal windows, daily/weekly rollover, and report dates.
        </p>
        <div className="relative max-w-sm" ref={tzRef}>
          <div
            className="flex items-center gap-2 w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm cursor-pointer"
            onClick={() => setTzOpen((v) => !v)}
          >
            <span className="flex-1">{timezone}</span>
            <span className="text-xs text-gray-400">{offsetLabel(timezone)}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${tzOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {tzOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  autoFocus
                  value={tzSearch}
                  onChange={(e) => setTzSearch(e.target.value)}
                  placeholder="Search timezone..."
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredTz.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400 text-center">No matches</div>
                ) : (
                  filteredTz.map((tz) => {
                    const active = tz === timezone;
                    return (
                      <button
                        type="button"
                        key={tz}
                        onClick={() => {
                          setTimezone(tz);
                          updateTimezone(tz);
                          setTzOpen(false);
                          setTzSearch("");
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          active ? "bg-brand/10 text-brand font-medium" : ""
                        }`}
                      >
                        <span className="flex-1">{tz}</span>
                        <span className="text-xs text-gray-400">{offsetLabel(tz)}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        {tzMsg && (
          <p className={`text-xs mt-1.5 ${tzMsg.includes("saved") ? "text-emerald-600" : "text-danger"}`}>
            {tzMsg}
          </p>
        )}
      </div>

      <ApiKeySetup user={user} />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium mb-3">Account</h3>
        <button
          onClick={signOut}
          className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:opacity-90"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-danger/30 p-4">
        <h3 className="font-medium text-danger mb-3">Danger Zone</h3>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-4 py-1.5 border border-danger text-danger rounded-lg text-sm font-medium hover:bg-danger/5"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-danger">
              This will permanently delete all your data. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-3 py-1 text-sm bg-danger text-white rounded-lg">
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
