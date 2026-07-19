import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail, resendVerification } from "../lib/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "prompt">("prompt");

  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");
    if (userId && secret) {
      setStatus("verifying");
      verifyEmail(userId, secret)
        .then(() => setStatus("success"))
        .catch(() => setStatus("error"));
    }
  }, [searchParams]);

  const handleResend = async () => {
    try {
      await resendVerification();
      alert("Verification email sent! Check your inbox.");
    } catch {
      alert("Failed to resend. Try again later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">⏱ Work Tracker</h1>
        {status === "verifying" && (
          <div className="card p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-3" />
            <p className="text-sm text-gray-500">Verifying your email...</p>
          </div>
        )}
        {status === "success" && (
          <div className="card p-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-semibold mb-1">Email verified!</p>
            <p className="text-sm text-gray-500 mb-4">Your account is ready to use.</p>
            <Link to="/dashboard" className="btn-primary inline-block">Go to Dashboard</Link>
          </div>
        )}
        {status === "error" && (
          <div className="card p-6">
            <div className="text-4xl mb-2">❌</div>
            <p className="font-semibold mb-1">Verification failed</p>
            <p className="text-sm text-gray-500 mb-4">The link may be invalid or expired.</p>
            <button onClick={handleResend} className="btn-primary">Resend Verification</button>
          </div>
        )}
        {status === "prompt" && (
          <div className="card p-6">
            <div className="text-4xl mb-2">📧</div>
            <p className="font-semibold mb-1">Check your email</p>
            <p className="text-sm text-gray-500 mb-4">
              We sent a verification link. Click it to activate your account.
            </p>
            <button onClick={handleResend} className="btn-primary">Resend Email</button>
            <p className="mt-3 text-xs text-gray-400">
              <Link to="/login" className="text-brand hover:underline">Back to sign in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
