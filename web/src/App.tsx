import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser } from "./lib/auth";
import type { Models } from "appwrite";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";

export default function App() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const onAuth = useCallback((u: Models.User<Models.Preferences>) => setUser(u), []);
  const onSignOut = useCallback(() => setUser(null), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup onAuth={onAuth} />} />
        <Route path="*" element={<Login onAuth={onAuth} />} />
      </Routes>
    );
  }

  return (
    <Layout user={user} onSignOut={onSignOut}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/reports" element={<Reports user={user} />} />
        <Route path="/goals" element={<Goals user={user} />} />
        <Route path="/settings" element={<Settings user={user} onSignOut={onSignOut} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
