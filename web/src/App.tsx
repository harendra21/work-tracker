import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getCurrentUser, signOut } from "./lib/auth";
import type { Models } from "appwrite";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Extension from "./pages/Extension";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function App() {
  const location = useLocation();
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
        <motion.div
          className="rounded-full h-8 w-8 border-2 border-brand"
          style={{ borderTopColor: "transparent", borderLeftColor: "transparent" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: "easeOut" }}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/extension" element={<Extension />} />
            <Route path="/login" element={<Login onAuth={onAuth} />} />
            <Route path="/signup" element={<Signup onAuth={onAuth} />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: "easeOut" }}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/extension" element={<Extension />} />
          <Route path="/verify" element={<VerifyEmail />} />
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
      </motion.div>
    </AnimatePresence>
  );
}
