import { useState } from "react";
import type { Models } from "appwrite";
import { account } from "../lib/appwrite";
import { clearCachedUser } from "../lib/auth";
import ApiKeySetup from "../components/ApiKeySetup";

export default function Settings({
  user,
  onSignOut,
}: {
  user: Models.User<Models.Preferences>;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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

  const signOut = async () => {
    clearCachedUser();
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
