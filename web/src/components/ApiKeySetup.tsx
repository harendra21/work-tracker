import { useState, useEffect } from "react";
import type { Models } from "appwrite";
import type { ApiKey } from "../types";
import { fetchApiKeys, generateApiKey, deleteApiKey } from "../lib/data";

function KeyRow({
  k,
  onCopy,
  onDelete,
  copied,
}: {
  k: ApiKey;
  onCopy: (key: string) => void;
  onDelete: (id: string) => void;
  copied: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const masked = k.key ? `${k.key.slice(0, 12)}••••••••••••${k.key.slice(-8)}` : "";

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:border-brand/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{k.name || "Unnamed"}</p>
        <p
          className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate mt-0.5"
          title={k.key}
        >
          {visible ? k.key : masked}
        </p>
      </div>
      <button
        onClick={() => setVisible((v) => !v)}
        title={visible ? "Hide key" : "Show key"}
        className="flex-shrink-0 w-7 h-7 inline-flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
      >
        {visible ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
      <button
        onClick={() => onCopy(k.key)}
        className="flex-shrink-0 px-2.5 h-7 inline-flex items-center text-[11px] font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {copied === k.key ? "✓ Copied" : "Copy"}
      </button>
      <button
        onClick={() => onDelete(k.$id)}
        title="Delete key"
        className="flex-shrink-0 w-7 h-7 inline-flex items-center justify-center rounded border border-red-200 dark:border-red-800/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

export default function ApiKeySetup({ user }: { user: Models.User<Models.Preferences> }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("VS Code Extension");

  useEffect(() => {
    fetchApiKeys(user.$id)
      .then((rows) => setKeys(rows as unknown as ApiKey[]))
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, [user.$id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const row = await generateApiKey(user.$id, newKeyName);
      setKeys((prev) => [...prev, row as unknown as ApiKey]);
      setNewKeyName("VS Code Extension");
    } catch {
      alert("Failed to generate API key.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (rowId: string) => {
    if (!confirm("Delete this API key? The extension will stop working.")) return;
    try {
      await deleteApiKey(rowId);
      setKeys((prev) => prev.filter((k) => k.$id !== rowId));
    } catch {
      alert("Failed to delete key.");
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">API Keys</h3>
        <span className="text-xs text-gray-400">{keys.length} key(s)</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (optional)"
          className="input flex-1"
        />
        <button onClick={handleGenerate} disabled={generating} className="btn-primary">
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <>+ Generate Key</>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand/30 border-t-brand" />
        </div>
      ) : keys.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          No API keys yet. Generate one above, then paste it into the VS Code extension.
        </p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <KeyRow key={k.$id} k={k} onCopy={handleCopy} onDelete={handleDelete} copied={copied} />
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 space-y-1.5 border border-blue-100 dark:border-blue-800/30">
        <p className="font-semibold mb-1">Setup instructions</p>
        <p>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 text-[10px] font-bold mr-1.5">
            1
          </span>
          Generate a key above and copy it.
        </p>
        <p>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 text-[10px] font-bold mr-1.5">
            2
          </span>
          In VS Code, run{" "}
          <code className="px-1 py-0.5 bg-white/50 dark:bg-black/20 rounded text-[11px]">
            Work Tracker: Setup API Key
          </code>{" "}
          and paste it.
        </p>
        <p>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 text-[10px] font-bold mr-1.5">
            3
          </span>
          The extension will start tracking automatically.
        </p>
      </div>
    </div>
  );
}
