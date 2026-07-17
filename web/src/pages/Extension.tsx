import { Link } from "react-router-dom";

const MARKETPLACE_URL =
  "https://marketplace.visualstudio.com/items?itemName=harendra21.work-tracker";

const SCREENSHOTS = [
  { src: "/images/dashboard.png", label: "Dashboard overview" },
  { src: "/images/dashboard2.png", label: "Analytics & insights" },
  { src: "/images/reports.png", label: "Detailed reports" },
  { src: "/images/goals.png", label: "Goals & streaks" },
];

const FEATURES = [
  { icon: "🕒", title: "Automatic heartbeats", desc: "Captured on file open, edit, save, and switch — no manual timers." },
  { icon: "📊", title: "Rich dashboard", desc: "Focus score, productivity score, trend charts, heatmaps, and file leaderboards." },
  { icon: "🎯", title: "Goals & streaks", desc: "Set daily or weekly coding targets with live progress rings and streak tracking." },
  { icon: "📋", title: "Per-project breakdown", desc: "See time spent by project, language, file, and branch. Filter by any dimension." },
  { icon: "🔒", title: "Privacy-first", desc: "No code ever leaves your machine. Only paths, languages, and timestamps are sent." },
  { icon: "💾", title: "Offline queue", desc: "Heartbeats queue locally and sync when you reconnect. Never lose data." },
  { icon: "⚡", title: "Lightweight", desc: "Built with esbuild. ~180KB bundle. No dependencies on heavy frameworks." },
  { icon: "🔧", title: "Fully configurable", desc: "Exclude patterns, idle timeout, flush interval, status bar toggle, and more." },
];

const COMMANDS = [
  { cmd: "Work Tracker: Setup API Key", desc: "Paste a new API key from the web dashboard" },
  { cmd: "Work Tracker: Open Dashboard", desc: "Open your coding stats in VS Code" },
  { cmd: "Work Tracker: Open Goals", desc: "View and manage your goals" },
  { cmd: "Work Tracker: Toggle Tracking", desc: "Pause or resume tracking globally" },
  { cmd: "Work Tracker: Flush Heartbeats Now", desc: "Force-upload queued heartbeats" },
  { cmd: "Work Tracker: Show Status", desc: "View your user ID, queue size, and tracking state" },
];

const SETTINGS = [
  { key: "workTracker.apiKey", default: '""', desc: "API key from the web dashboard" },
  { key: "workTracker.trackingEnabled", default: "true", desc: "Global kill switch" },
  { key: "workTracker.heartbeatIntervalSeconds", default: "300", desc: "Flush interval (min 30)" },
  { key: "workTracker.keystrokeTimeoutMinutes", default: "15", desc: "Idle gap for session splitting" },
  { key: "workTracker.excludePatterns", default: "[]", desc: "Regex patterns to skip files" },
  { key: "workTracker.statusBarEnabled", default: "true", desc: "Show time in status bar" },
  { key: "workTracker.debug", default: "false", desc: "Verbose logging" },
];

export default function Extension() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">⏱</span>
            <span className="font-bold gradient-text text-base">Work Tracker</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-1.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="flex flex-col items-center text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-teal-500 flex items-center justify-center text-3xl mb-4 shadow-lg">
            ⏱
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Work Tracker for{" "}
            <span className="gradient-text">VS Code</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
            Automatic daily coding time tracker with a beautiful web dashboard, goals,
            streaks, and privacy-first design.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <a
              href={MARKETPLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base px-8 py-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Install from Marketplace
            </a>
            <Link to="/signup" className="btn-secondary text-base px-8 py-3">
              Create Free Account
            </Link>
          </div>
          <a
            href={MARKETPLACE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4"
          >
            <img
              src="https://img.shields.io/badge/VS%20Code-Marketplace-5C9EAD?style=for-the-badge&logo=visual-studio-code&logoColor=white"
              alt="VS Code Marketplace"
              className="h-7"
            />
          </a>
        </div>
      </section>

      {/* Screenshots */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="grid sm:grid-cols-2 gap-4">
          {SCREENSHOTS.map((s, i) => (
            <div
              key={s.label}
              className="card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <img
                src={s.src}
                alt={s.label}
                className="w-full h-auto"
              />
              <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-100 dark:border-gray-800">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          <span className="gradient-text">Features</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card card-hover p-5 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-lg mb-3">
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Commands */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          <span className="gradient-text">Commands</span>
        </h2>
        <div className="card overflow-hidden">
          {COMMANDS.map((c, i) => (
            <div
              key={c.cmd}
              className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                i < COMMANDS.length - 1
                  ? "border-b border-gray-100 dark:border-gray-800"
                  : ""
              }`}
            >
              <div>
                <code className="text-sm font-medium text-brand">{c.cmd}</code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          <span className="gradient-text">Configuration</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm card">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Setting
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Default
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {SETTINGS.map((s, i) => (
                <tr
                  key={s.key}
                  className={
                    i < SETTINGS.length - 1
                      ? "border-b border-gray-100 dark:border-gray-800"
                      : ""
                  }
                >
                  <td className="px-5 py-3">
                    <code className="text-brand text-xs">{s.key}</code>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-xs text-gray-500 dark:text-gray-400">
                      {s.default}
                    </code>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs">
                    {s.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/70 dark:border-gray-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-base">⏱</span>
            <span className="font-medium text-gray-500 dark:text-gray-400">Work Tracker</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-brand transition-colors">Home</Link>
            <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">
              Marketplace
            </a>
            <a href="https://github.com/harendra21/work-tracker" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">
              GitHub
            </a>
            <Link to="/login" className="hover:text-brand transition-colors">Sign In</Link>
          </div>
          <p className="text-xs">MIT License</p>
        </div>
      </footer>
    </div>
  );
}
