import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser, signOut } from "./lib/auth";
import type { Models } from "appwrite";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Extension from "./pages/Extension";
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
  const onSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

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
        <Route path="/" element={<Home />} />
        <Route path="/extension" element={<Extension />} />
        <Route path="/login" element={<Login onAuth={onAuth} />} />
        <Route path="/signup" element={<Signup onAuth={onAuth} />} />
        <Route path="*" element={<Home />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/extension" element={<Extension />} />
      <Route
        path="/dashboard"
        element={
          <Layout user={user} onSignOut={onSignOut}>
            <Dashboard user={user} />
          </Layout>
        }
      />
      <Route
        path="/reports"
        element={
          <Layout user={user} onSignOut={onSignOut}>
            <Reports user={user} />
          </Layout>
        }
      />
      <Route
        path="/goals"
        element={
          <Layout user={user} onSignOut={onSignOut}>
            <Goals user={user} />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout user={user} onSignOut={onSignOut}>
            <Settings user={user} onSignOut={onSignOut} onUserUpdate={onAuth} />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
