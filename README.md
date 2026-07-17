# Work Tracker

> Automatic daily coding time tracker for VS Code — with a beautiful web dashboard, goals, and streaks.

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-5C9EAD?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=harendra21.work-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Powered by Appwrite](https://img.shields.io/badge/Powered%20by-Appwrite-FD366E?style=for-the-badge)](https://appwrite.io)

A privacy-respecting WakaTime alternative built on [Appwrite](https://appwrite.io). Tracks your coding time automatically, breaks it down by project, language, and day, and shows it all in a modern web dashboard with goals and streaks.

<p align="center">
  <img src="media/banner.png" alt="Work Tracker" width="800">
</p>

---

## ✨ Features

### 🕒 Automatic, frictionless tracking

- Heartbeats captured on every file activity (open, edit, save, switch)
- Zero config — works the moment you install and sign in
- Offline-first: heartbeats queue locally and sync when you reconnect
- Lightweight: 5-minute flush interval respects Appwrite's free-tier rate limits

### 📊 Insightful web dashboard

- **Focus Score** and **Productivity Score** rings
- 7-day week strip, daily trend chart, hourly timeline
- Heatmap by day-of-week × hour-of-day
- Per-project, per-language, and per-file breakdowns
- Lines added/removed metrics
- Auto-generated insights ("🐦 Early bird", "💥 Biggest change", "🔀 Context switching", "🧹 Refactor mode", etc.)

### 🎯 Goals & streaks

- Daily and weekly time goals (e.g. "Code 2 hours every day")
- Per-language and per-project goal filters
- Live progress ring with color-coded status (red → amber → green)
- 🎉 celebration when a goal is hit
- Streak tracking across the dashboard

### 🔐 Privacy-first

- **No code ever leaves your machine** — only file paths, project names, languages, line counts, and timestamps
- Regex `excludePatterns` to skip sensitive folders
- Global `trackingEnabled: false` kill switch
- Self-hostable: bring your own Appwrite project, your data stays with you

### ⚙️ Developer-friendly

- TypeScript + esbuild (no webpack, no bloat)
- Tiny extension bundle (~180KB)
- 9 commands accessible from the Command Palette
- Configurable via standard VS Code settings

---

## 🚀 Quick start

### 1. Install the extension

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=harendra21.work-tracker), or via CLI:

```bash
code --install-extension harendra21.work-tracker
```

### 2. Create a free account

Open the [web dashboard](https://work-tracker.appwrite.network), sign up with email + password.

### 3. Generate an API key

In the dashboard, go to **Settings → API Keys** and click **Generate Key**. Give it a name (e.g. "My Laptop").

### 4. Connect VS Code

In VS Code, run **Work Tracker: Setup API Key** from the Command Palette (`Ctrl+Shift+P`), paste your key, and click **Reload Now**.

### 5. Start coding

Open any file. The status bar will show today's coding time. Visit the dashboard anytime to see your stats.

---

## 📸 Dashboard preview

The web dashboard lives at [work-tracker.appwrite.network](https://work-tracker.appwrite.network) and includes:

- **Hero header** with personalized greeting and live period total
- **Focus Score** ring (longest uninterrupted session)
- **Productivity Score** ring (consistency + focus + volume)
- **Insights** auto-generated from your data
- **Donut charts** for projects and languages (click to filter Reports)
- **Trend chart** (click a day to jump into Reports)
- **Activity heatmap** (click any cell to filter)
- **File leaderboard** with `project-name/filename.ext` format

The **Reports** page offers detailed per-day breakdowns, top projects with medals 🥇🥈🥉, editing pattern stats (longest session, peak hour, write ratio, active days), and 5 advanced insights.

The **Goals** page shows live progress rings for each goal with live ticking every minute.

---

## ⚙️ Configuration

All settings live under the `workTracker.*` namespace. Open **Settings** (`Ctrl+,`) and search for "Work Tracker".

| Setting                                | Default | Description                                                              |
| -------------------------------------- | ------- | ------------------------------------------------------------------------ |
| `workTracker.apiKey`                   | `""`    | Generated API key from the web dashboard.                                |
| `workTracker.trackingEnabled`          | `true`  | Global kill switch. When `false`, no heartbeats are recorded.            |
| `workTracker.heartbeatIntervalSeconds` | `300`   | How often (in seconds) to flush queued heartbeats to the server. Min 30. |
| `workTracker.keystrokeTimeoutMinutes`  | `15`    | Idle gap (in minutes) used to join heartbeats into durations.            |
| `workTracker.excludePatterns`          | `[]`    | Regex patterns. Files whose path matches are never tracked.              |
| `workTracker.statusBarEnabled`         | `true`  | Show today's coding time in the status bar.                              |
| `workTracker.showLinesChanged`         | `true`  | Track lines added and removed per file.                                  |
| `workTracker.hideProjectFolder`        | `false` | Send only the relative path inside the project (e.g. `src/main.ts`).     |
| `workTracker.debug`                    | `false` | Verbose logging to the Work Tracker output channel.                      |

### Example: `settings.json`

```json
{
  "workTracker.apiKey": "wt_eyJpZCI6Li4uX2FiY2RlZg_AbCdEf1234567890",
  "workTracker.heartbeatIntervalSeconds": 180,
  "workTracker.excludePatterns": [".*\\.log$", "node_modules", "\\.git/"],
  "workTracker.statusBarEnabled": true
}
```

---

## 📋 Commands

Open the Command Palette (`Ctrl+Shift+P`) and type "Work Tracker":

| Command                              | Description                                |
| ------------------------------------ | ------------------------------------------ |
| `Work Tracker: Setup API Key`        | Paste a new API key from the dashboard.    |
| `Work Tracker: Open Dashboard`       | Open the web dashboard in your browser.    |
| `Work Tracker: Open Goals`           | Open the goals page in your browser.       |
| `Work Tracker: Toggle Tracking`      | Pause/resume tracking globally.            |
| `Work Tracker: Flush Heartbeats Now` | Force-upload any queued heartbeats.        |
| `Work Tracker: Show Status`          | Show user, queue size, and tracking state. |

---

## 🛡️ Privacy

- **No code is uploaded.** Only file paths, project names, languages, line counts, and timestamps are sent to your Appwrite backend.
- Use `excludePatterns` to skip folders like `node_modules`, `dist`, `.env`, etc.
- Use the global `trackingEnabled: false` to disable all tracking instantly.
- Delete your account from the Appwrite console to remove all data permanently.
- Self-hostable: bring your own Appwrite project to keep data on your own infrastructure.

---

## 🏗️ Architecture

```
┌─────────────────┐     heartbeats     ┌──────────────┐
│   VS Code       │ ─────────────────▶ │   Appwrite   │
│   Extension     │     (every 5min)   │   Cloud      │
│  (TypeScript)   │                    │   (TablesDB) │
└────────┬────────┘                    └──────┬───────┘
         │                                    │
         │ offline queue                      │ tables
         │  (JSON file)                       ▼
         │                            ┌──────────────┐
         │                            │   React      │
         │   web dashboard ◀──────── │   Dashboard  │
         │  (read-only)               │   (Vite SPA) │
         └────────────────────────────└──────────────┘
```

- **Extension** (`src/`) — TypeScript, esbuild, Appwrite Node SDK, local JSON offline queue
- **Web dashboard** (`web/`) — React 19, Vite 6, Tailwind 3, Recharts, Appwrite Web SDK, deployed on Appwrite Sites

---

## 🧰 Development

```bash
npm install              # install extension deps
npm run watch            # build on save (extension)
# Press F5 in VS Code to launch the Extension Development Host
npm run test             # run unit tests (vitest)
npm run package          # build a .vsix
```

### Web dashboard (separate)

```bash
cd web
npm install
npm run dev              # vite dev server with HMR
npm run build            # production build
```

### Appwrite backend setup

The extension expects an Appwrite project with the following tables (see `appwrite/setup.ps1` for the full idempotent script):

- `heartbeats` — one row per coding session
- `projects` — per-project metadata (color, isHidden, trackingEnabled)
- `goals` — daily/weekly time targets
- `api_keys` — generated keys for extension auth

All tables need permissions: `create("any")`, `read("any")`, `update("any")`, `delete("any")`.

---

## 🤝 Contributing

Issues and PRs welcome at [github.com/harendra21/work-tracker](https://github.com/harendra21/work-tracker/issues).

---

## 📄 License

[MIT](LICENSE)


npm run package && npx vsce publish