# Changelog

All notable changes to **Work Tracker** are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-07-19

### Added

- 🌍 **Timezone support** — set your timezone in Settings (35 IANA timezones, searchable dropdown with GMT offsets). Goals, daily/weekly windows, and report dates respect your timezone.
- 🎯 **Customizable goals** — per-language and per-project goal filters with toggle-chip dropdowns in the creation form
- 🔍 **Goal filter bar** — filter goals by name, language, or project in real time
- 📅 **Day of week breakdown** chart on Dashboard — see total time per day of the week
- 🖼️ **Marketing website** — complete Home page with hero, carousel, features, stats, FAQ accordion, image lightbox
- 📄 **Extension detail page** at `/extension` with screenshots, feature grid, commands/settings tables
- 🔗 **SEO meta tags** and JSON-LD structured data on the landing page

### Changed

- Dashboard defaults to **7 days** instead of "Today"
- Range selection persists in `localStorage` across sessions (Dashboard & Reports)
- **Custom date range** on Reports page with from/to date pickers (future dates disabled)
- Goal progress ring increased from 96px → 160px with text overflow fixes
- Goal hit animation now uses border glow instead of scaling the entire card
- Appwrite endpoint consolidated to `cloud.appwrite.io/v1`

### Fixed

- Sign in/out properly calls Appwrite `signOut()` API
- Sidebar nav points to `/dashboard` consistently
- Test CI failure by adding vscode module mock

## [0.2.3] - 2026-07-17

### Added

- GitHub Actions CI with automated publish on `v*` tags
- Vitest setup with vscode module mock

### Fixed

- Publisher name changed to `harendra21`

## [0.2.2] - 2026-07-17

### Fixed

- CI workflow: add explicit build step before publish

## [0.2.1] - 2026-07-17

### Added

- Automated publish workflow via GitHub Actions with `VSCE_PAT` secret

## [0.2.0] - 2026-07-17

### Changed

- Removed 4 unnecessary Appwrite settings (`appwriteEndpoint`, `appwriteProjectId`, `appwriteApiKey`, `appwriteUserId`) — hardcoded endpoint/project ID, auto-resolved userId

## [0.1.0] - 2026-07-16

### Added

- 🎯 **Goals** with live progress rings, color-coded status (red/amber/green), and 🎉 celebration on hit
- 📊 **Focus Score** and **Productivity Score** rings on the dashboard
- 🌐 **Web dashboard** with:
  - Range picker (Today / 7d / 30d / 90d)
  - Donut charts for projects and languages
  - Trend chart, timeline, activity heatmap, file leaderboard
  - Reports page with per-day expandable groups, top-projects medals 🥇🥈🥉
  - 15+ auto-generated insights
  - Light/dark mode with system preference
  - Mobile-friendly layout
  - 3-step onboarding wizard
  - Skeleton loaders on data-heavy pages
  - Clickable charts that filter the Reports page
- 🔑 **API key auth** — generate keys in the web dashboard
- 📥 **Offline queue** — heartbeats queue locally and sync when online
- 🔁 **Live ticking** — goal progress recomputes every 60s
- ⚙️ **Per-project tracking toggle** in the dashboard
- 🎛️ **9 commands** in the Command Palette
- 🪵 **Debug logging** to the Work Tracker output channel

### Changed

- Heartbeats use `activeSeconds` accumulator with idle detection (2 min idle splits sessions, 15 min per-heartbeat cap)
- File tracking uses `project-name/filename.ext` display format
- Goals filter applies to languages and projects

### Security

- All tables use `("any")` permissions with API-key based auth
- No code content is ever sent to the server — only metadata
