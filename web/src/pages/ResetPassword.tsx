import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../lib/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = searchParams.get("userId") || "";
  const secret = searchParams.get("secret") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(userId, secret, password);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !secret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="card p-6 text-center max-w-sm">
          <div className="text-4xl mb-2">❌</div>
          <p className="font-semibold mb-1">Invalid reset link</p>
          <p className="text-sm text-gray-500 mb-4">This link is missing required parameters.</p>
          <Link to="/forgot-password" className="text-brand text-sm hover:underline">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">⏱ Work Tracker</h1>
        <p className="text-center text-sm text-gray-500 mb-6">Set a new password</p>
        {status === "success" ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-semibold mb-1">Password reset!</p>
            <p className="text-sm text-gray-500 mb-4">You can now sign in with your new password.</p>
            <Link to="/login" className="btn-primary inline-block">Sign In</Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 space-y-4"
          >
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
