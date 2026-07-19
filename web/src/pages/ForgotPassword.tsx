import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordRecovery } from "../lib/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordRecovery(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send recovery email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">⏱ Work Tracker</h1>
        <p className="text-center text-sm text-gray-500 mb-6">Reset your password</p>
        {sent ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-4xl mb-2">📧</div>
            <p className="font-semibold mb-1">Check your email</p>
            <p className="text-sm text-gray-500 mb-4">
              We sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link to="/login" className="text-brand text-sm hover:underline">Back to sign in</Link>
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
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-brand hover:underline">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
