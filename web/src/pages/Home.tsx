import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "🕒",
    title: "Automatic Tracking",
    desc: "Heartbeats captured on every file activity — open, edit, save, switch. Zero config, works instantly.",
  },
  {
    icon: "📊",
    title: "Beautiful Dashboard",
    desc: "Focus scores, trend charts, activity heatmaps, per-project breakdowns, and auto-generated insights.",
  },
  {
    icon: "🎯",
    title: "Goals & Streaks",
    desc: "Set daily or weekly targets, track live progress rings, and maintain your coding streak.",
  },
  {
    icon: "🔒",
    title: "Privacy First",
    desc: "No code ever leaves your machine. Only file paths, languages, and timestamps. Self-hostable.",
  },
  {
    icon: "📋",
    title: "Detailed Reports",
    desc: "Per-day breakdowns, editing patterns, context switching analysis, and CSV export.",
  },
  {
    icon: "⚡",
    title: "Lightweight",
    desc: "Built with TypeScript + esbuild. Tiny ~180KB extension bundle. No bloat.",
  },
];

const MARKETPLACE_URL =
  "https://marketplace.visualstudio.com/items?itemName=harendra21.work-tracker";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱</span>
            <span className="font-bold gradient-text text-base">Work Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="btn-primary text-sm px-4 py-1.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
              Now on VS Code Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Track your{" "}
              <span className="gradient-text">coding time</span>
              <br />
              automatically.
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              A privacy-respecting WakaTime alternative built on Appwrite. See
              your time per project, language, and day with a beautiful web
              dashboard, goals, and streaks.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="btn-primary text-base px-8 py-3 w-full sm:w-auto"
              >
                Get Started Free
              </Link>
              <a
                href={MARKETPLACE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base px-8 py-3 w-full sm:w-auto inline-flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Install Extension
              </a>
            </div>
            <div className="mt-6 flex items-center gap-4 justify-center lg:justify-start text-sm text-gray-400">
              <a
                href={MARKETPLACE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://img.shields.io/badge/VS%20Code-Marketplace-5C9EAD?style=for-the-badge&logo=visual-studio-code&logoColor=white"
                  alt="VS Code Marketplace"
                  className="h-7"
                />
              </a>
              <a
                href="https://github.com/harendra21/work-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <img
                  src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"
                  alt="GitHub"
                  className="h-7"
                />
              </a>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg animate-fade-in">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand/20 to-teal-500/20 rounded-3xl blur-3xl" />
              <img
                src="/banner.png"
                alt="Work Tracker Dashboard"
                className="relative rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Everything you need to{" "}
            <span className="gradient-text">track your time</span>
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Automatic, privacy-first coding time tracking with zero configuration
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card card-hover p-6 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-lg mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand/10 via-white to-teal-500/10 dark:from-brand/5 dark:via-gray-900 dark:to-teal-500/5 border border-gray-200/70 dark:border-gray-800/70 p-8 sm:p-12 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to track your coding time?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Install the VS Code extension, create a free account, and start seeing your stats in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="btn-primary text-base px-8 py-3"
              >
                Create Free Account
              </Link>
              <a
                href={MARKETPLACE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base px-8 py-3 inline-flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Install on VS Code
              </a>
            </div>
          </div>
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
            <a
              href={MARKETPLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand transition-colors"
            >
              Marketplace
            </a>
            <a
              href="https://github.com/harendra21/work-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand transition-colors"
            >
              GitHub
            </a>
            <Link to="/login" className="hover:text-brand transition-colors">
              Sign In
            </Link>
          </div>
          <p className="text-xs">MIT License &middot; No data collection</p>
        </div>
      </footer>
    </div>
  );
}
