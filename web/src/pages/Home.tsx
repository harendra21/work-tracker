import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../lib/auth";
import type { Models } from "appwrite";

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

const SLIDES = [
  {
    title: "Beautiful Dashboard",
    subtitle: "At-a-glance overview of your coding activity",
    items: [
      "Focus Score and Productivity Score rings",
      "Daily trend chart with clickable days",
      "Activity heatmap by day-of-week × hour",
      "Donut charts for projects and languages",
    ],
    src: "/images/dashboard.png",
  },
  {
    title: "Detailed Reports",
    subtitle: "Deep dive into your coding patterns",
    items: [
      "Per-day breakdowns with session details",
      "Top projects with medals and averages",
      "Editing patterns: longest session, peak hour, write ratio",
      "Advanced insights: refactor mode, polyglot score, context switching",
    ],
    src: "/images/reports.png",
  },
  {
    title: "Goals & Streaks",
    subtitle: "Stay motivated with daily and weekly targets",
    items: [
      "Set custom daily or weekly time goals",
      "Live progress rings with color-coded status",
      "Streak tracking to keep you consistent",
      "Celebration animation when you hit a goal",
    ],
    src: "/images/goals.png",
  },
  {
    title: "Activity Heatmap & Analytics",
    subtitle: "Visualize when you code most",
    items: [
      "Hourly timeline across your active day",
      "7-day week strip for quick comparison",
      "File leaderboard with lines changed",
      "Auto-generated insights: early bird, biggest change, and more",
    ],
    src: "/images/dashboard2.png",
  },
];

const FAQS = [
  {
    q: "How does Work Tracker work?",
    a: "Work Tracker monitors your file activity in VS Code (opens, edits, saves, tab switches) and records heartbeats. These are batched every 5 minutes and sent to your Appwrite backend. The web dashboard then aggregates this data into charts, insights, and reports.",
  },
  {
    q: "Is my code safe?",
    a: "Absolutely. No code ever leaves your machine. Only metadata is sent — file paths, project names, language names, line counts, and timestamps. You can also use exclude patterns to skip sensitive folders and a global kill switch to disable tracking instantly.",
  },
  {
    q: "Is this a WakaTime alternative?",
    a: "Yes. Work Tracker is a privacy-respecting, open-source alternative to WakaTime. It offers similar features — automatic time tracking, per-project breakdowns, goals, streaks — but with the flexibility of self-hosting on your own Appwrite project.",
  },
  {
    q: "Do I need a credit card?",
    a: "No. Work Tracker is free and open source (MIT). The web dashboard is free to use. If you self-host, you only pay for your Appwrite cloud plan, which has a generous free tier.",
  },
  {
    q: "What data is tracked?",
    a: "Work Tracker records: file paths, project names, programming languages, git branches, line additions/removals, timestamps, and session durations. No code content, clipboard data, or screenshots are ever captured.",
  },
  {
    q: "Can I self-host the backend?",
    a: "Yes. The entire backend runs on Appwrite. You can create your own Appwrite project, run the setup script, and point the extension to your endpoint. All data stays in your own infrastructure.",
  },
];

const MARKETPLACE_URL =
  "https://marketplace.visualstudio.com/items?itemName=harendra21.work-tracker";

function StepCard({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="card card-hover p-6 sm:p-8 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-teal-500 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
        {n}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
      >
        <span className="font-medium text-sm sm:text-base">{q}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed animate-slide-up">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">⏱</span>
            <span className="font-bold gradient-text text-base">Work Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="btn-primary text-sm px-4 py-1.5"
              >
                Dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  alt="Install Work Tracker from VS Code Marketplace"
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
                  alt="Work Tracker on GitHub"
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
                alt="Work Tracker dashboard preview showing coding time analytics, charts, and insights"
                className="relative rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          How it <span className="gradient-text">works</span>
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-lg mx-auto">
          Get started in three simple steps
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          <StepCard
            n="1"
            title="Install the Extension"
            desc="Install Work Tracker from the VS Code Marketplace. It starts tracking automatically — no configuration needed."
          />
          <StepCard
            n="2"
            title="Create Your Account"
            desc="Sign up on the web dashboard with your email. Generate an API key from the Settings page."
          />
          <StepCard
            n="3"
            title="Connect & Track"
            desc="Paste your API key into VS Code via the Command Palette. Your coding time is now tracked in real-time."
          />
        </div>
      </section>

      {/* Carousel */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          See it in <span className="gradient-text">action</span>
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          Explore the dashboard features through these screenshots
        </p>
        <div className="relative overflow-hidden rounded-2xl card">
          <div className="flex flex-col lg:flex-row items-stretch">
            <div className="lg:w-2/5 p-6 sm:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium mb-4 w-fit">
                {SLIDES[slide].title}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">{SLIDES[slide].title}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{SLIDES[slide].subtitle}</p>
              <ul className="space-y-3">
                {SLIDES[slide].items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <svg
                      className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-3/5 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-2 sm:p-4">
              <button
                onClick={() => setLightbox(SLIDES[slide].src)}
                className="w-full h-full group relative flex items-center justify-center"
                aria-label={`Expand ${SLIDES[slide].title} screenshot`}
              >
                <img
                  src={SLIDES[slide].src}
                  alt={`Work Tracker ${SLIDES[slide].title} screenshot`}
                  className="w-full h-[460px] object-contain rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Click to expand
                </span>
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={() => setSlide((s) => (s === 0 ? SLIDES.length - 1 : s - 1))}
              className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label="Previous slide"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  role="tab"
                  aria-selected={i === slide}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === slide
                      ? "bg-brand w-5"
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setSlide((s) => (s === SLIDES.length - 1 ? 0 : s + 1))}
              className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label="Next slide"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
          {[
            { n: "100%", label: "Free & Open Source" },
            { n: "6+", label: "VS Code Commands" },
            { n: "60+", label: "Languages Detected" },
            { n: "MIT", label: "License" },
          ].map((s) => (
            <div
              key={s.label}
              className="card p-6 sm:p-8 text-center animate-fade-in"
            >
              <div className="text-3xl sm:text-4xl font-extrabold gradient-text">
                {s.n}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
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
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-lg mb-4" aria-hidden="true">
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

      {/* Privacy */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="card overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-2/5 p-8 sm:p-12 bg-gradient-to-br from-brand/5 to-teal-500/5 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-2xl mb-4" aria-hidden="true">🔒</div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Privacy by design
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your code never leaves your machine. Work Tracker is built with privacy as a core principle, not an afterthought.
              </p>
            </div>
            <div className="lg:w-3/5 p-8 sm:p-12 grid sm:grid-cols-2 gap-6">
              {[
                { title: "No code upload", desc: "Only file paths, languages, and timestamps are sent. Never the contents of your files." },
                { title: "Self-hostable", desc: "Bring your own Appwrite project. Your data stays on your infrastructure, under your control." },
                { title: "Exclude patterns", desc: "Use regex patterns to skip sensitive folders like node_modules, .env, or dist." },
                { title: "Kill switch", desc: "Global toggle to pause all tracking instantly. No data is collected when disabled." },
              ].map((item) => (
                <div key={item.title}>
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Frequently asked <span className="gradient-text">questions</span>
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          Everything you need to know about Work Tracker
        </p>
        <div className="card divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              q={faq.q}
              a={faq.a}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand/10 via-white to-teal-500/10 dark:from-brand/5 dark:via-gray-900 dark:to-teal-500/5 border border-gray-200/70 dark:border-gray-800/70 p-8 sm:p-14 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Install on VS Code
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              No credit card required &middot; Free & open source &middot; MIT License
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded screenshot"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close expanded view"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Expanded screenshot"
            className="max-w-full max-h-full rounded-lg shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200/70 dark:border-gray-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg" aria-hidden="true">⏱</span>
                <span className="font-bold gradient-text">Work Tracker</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Automatic daily coding time tracker for VS Code. Free, open source, privacy-first.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Product</h4>
              <div className="flex flex-col gap-2 text-sm">
                <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">Marketplace</a>
                <Link to="/extension" className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">Features</Link>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">Sign In</Link>
                <Link to="/signup" className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">Sign Up</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Links</h4>
              <div className="flex flex-col gap-2 text-sm">
                <a href="https://github.com/harendra21/work-tracker" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">GitHub</a>
                <a href="https://github.com/harendra21/work-tracker/issues" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">Report Issue</a>
                <a href="https://github.com/harendra21/work-tracker/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">License</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p>&copy; {new Date().getFullYear()} Work Tracker. MIT License.</p>
            <p>Built with VS Code Extension API &amp; Appwrite</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
