import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Models } from "appwrite";
import ThemeToggle from "./ThemeToggle";
import OnboardingWizard from "./OnboardingWizard";

const NAV = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/reports", label: "Reports", icon: "📋" },
  { to: "/goals", label: "Goals", icon: "🎯" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Layout({
  children,
  user,
  onSignOut,
}: {
  children: React.ReactNode;
  user: Models.User<Models.Preferences>;
  onSignOut: () => void;
}) {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Desktop sidebar — fixed */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/70 dark:border-gray-700/70 z-30">
        <SidebarContent user={user} loc={loc} onSignOut={onSignOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-700/70 z-40 flex items-center justify-between px-4 gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <span className="text-lg">⏱</span>
          <span className="font-bold gradient-text text-sm truncate">Work Tracker</span>
        </Link>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-base font-bold gradient-text flex items-center gap-2">
                <span className="text-lg">⏱</span> Work Tracker
              </h1>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV.map((n) => {
                const active = loc.pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-gradient-to-r from-brand/15 to-teal-500/10 text-brand shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span className="text-base">{n.icon}</span>
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{user.name || "User"}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={onSignOut}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-danger py-1"
                >
                  Sign out
                </button>
                <ThemeToggle />
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-gray-200/70 dark:border-gray-700/70 safe-area-inset-bottom">
        <div className="grid grid-cols-4">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-brand" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className={`text-lg transition-transform ${active ? "scale-110" : ""}`}>
                  {n.icon}
                </span>
                {n.label}
                {active && <span className="absolute top-0 w-8 h-0.5 bg-brand rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 overflow-auto scrollbar-thin min-h-screen">
          {children}
        </div>
      </main>

      <OnboardingWizard />
    </div>
  );
}

function SidebarContent({
  user,
  loc,
  onSignOut,
}: {
  user: Models.User<Models.Preferences>;
  loc: { pathname: string };
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-gray-200/70 dark:border-gray-700/70 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-bold gradient-text flex items-center gap-2">
            <span className="text-xl">⏱</span> Work Tracker
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Coding time analytics
          </p>
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => {
          const active = loc.pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-brand/15 to-teal-500/10 text-brand shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 hover:translate-x-0.5"
              }`}
            >
              <span className={`text-base ${active ? "scale-110" : ""} transition-transform`}>
                {n.icon}
              </span>
              {n.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand animate-pulse-soft" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200/70 dark:border-gray-700/70">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user.name || user.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user.name || "User"}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-danger py-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );
}
