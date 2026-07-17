# Changelog

All notable changes to **Work Tracker** are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-07-16

### Added

- 🎯 **Goals** with live progress rings, color-coded status (red/amber/green), and 🎉 celebration on hit
- 📊 **Focus Score** and **Productivity Score** rings on the dashboard
- 🌐 **Web dashboard** deployed at [work-tracker.appwrite.network](https://work-tracker.appwrite.network) with:
  - Range picker (Today / 7d / 30d / 90d)
  - Donut charts for projects and languages
  - Trend chart, timeline, activity heatmap, file leaderboard
  - Reports page with per-day expandable groups, top-projects medals 🥇🥈🥉
  - 15+ auto-generated insights (Early bird, Biggest change, Refactor mode, Polyglot, Context switching, Late night, Weekend warrior, etc.)
  - Light/dark mode with system preference
  - Mobile-friendly layout (bottom tab bar, slide-out menu, responsive tables)
  - 3-step onboarding wizard for first-time users
  - Skeleton loaders on data-heavy pages
  - Clickable charts that filter the Reports page
- 🔑 **API key auth** — generate keys in the web dashboard, paste into VS Code via `Work Tracker: Setup API Key`
- 📥 **Offline queue** — heartbeats queue locally and sync when online
- 🔁 **Live ticking** — goal progress recomputes every 60s while you're on the page
- ⚙️ **Per-project tracking toggle** in the dashboard
- 🎛️ **9 commands** in the Command Palette (Setup API Key, Open Dashboard, Open Goals, Toggle Tracking, Flush Now, Show Status, Clear API Key, Get Queue Size, etc.)
- 🪵 **Debug logging** to the Work Tracker output channel

### Changed

- Heartbeats now use an `activeSeconds` accumulator with idle detection (2 min idle splits sessions, 15 min per-heartbeat cap)
- File tracking uses the new `project-name/filename.ext` display format
- Goals filter applies to languages and projects (comma-separated in DB)

### Security

- All tables (heartbeats, projects, goals, api_keys) use `("any")` permissions since the app uses API-key based auth
- No code content is ever sent to the server — only metadata

[0.1.0]: https://github.com/harendra21/work-tracker/releases/tag/v0.1.0
