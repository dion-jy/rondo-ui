# Rondo UI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

React dashboard for monitoring OpenClaw cron jobs and agent sessions.

**Live:** [rondo-ui.vercel.app](https://rondo-ui.vercel.app)

## Setup

1. Install the plugin:
   ```bash
   openclaw plugins install @dion-jy/rondo
   openclaw gateway restart
   ```

2. Open [rondo-ui.vercel.app](https://rondo-ui.vercel.app) and sign in with Google

3. Click **Link Device** and copy the link

4. Link your device (choose one):
   - **Chat:** Send `/rondo link <URL>` in Telegram/WhatsApp
   - **Terminal:** Run `openclaw rondo link <URL>`

5. Done! Your cron jobs will appear on the dashboard.

See the [Rondo plugin README](https://github.com/dion-jy/rondo) for full plugin documentation.

## Architecture

```
OpenClaw Gateway          Supabase          Rondo UI (Vercel)
┌──────────────┐     ┌───────────┐     ┌─────────────────┐
│ rondo plugin │────▶│  Tables   │◀────│  React + Vite   │
│ (push data)  │     │ cron_jobs │     │  Tailwind CSS   │
└──────────────┘     │ cron_runs │     │  Supabase Auth  │
                     │acp_sessions│    └─────────────────┘
                     └───────────┘
```

- The [Rondo plugin](https://github.com/dion-jy/rondo) (`@dion-jy/rondo`) pushes cron data to Supabase
- This frontend reads from Supabase and renders the dashboard
- No direct connection between frontend and gateway

## Features

- **Google SSO** — login via Supabase Auth (Google OAuth)
- **Stats overview** — active jobs, success rate, running count, token usage
- **24h timeline** — swim lane calendar with zoom, per-job rows, projected runs
- **Job list** — status, schedule, last run, error details
- **Execution log** — merged cron runs + ACP sessions, filterable by status
- **ACP sessions** — live agent session tracking with adaptive polling
- **Device linking** — generate one-time tokens to link OpenClaw instances
- **5 dark themes** — Midnight, Nord, Solarized, Dracula, Rose Pine
- **PWA** — installable on Android & iOS, offline app shell caching
- **Responsive** — mobile-friendly with bottom navigation

## Install as App (PWA)

Rondo can be installed as a standalone app on your phone or desktop.

### Android (Chrome)

1. Open [rondo-ui.vercel.app](https://rondo-ui.vercel.app) in Chrome
2. Tap the **"Install Rondo"** banner at the bottom, or tap the browser menu (three dots) → **"Install app"** / **"Add to Home screen"**
3. Rondo appears as a standalone app on your home screen

### iOS (Safari)

1. Open [rondo-ui.vercel.app](https://rondo-ui.vercel.app) in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add**

> **Note:** The PWA caches static assets (JS, CSS, HTML) for fast loading. Supabase API data is always fetched live — never stale from cache.

## Development

```bash
git clone https://github.com/dion-jy/rondo-ui.git
cd rondo-ui
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |

## Deployment

Deployed to Vercel via GitHub Actions:

- **Pull requests** → preview deployment (URL posted as PR comment)
- **Push to `main`** → production deployment

### Required GitHub Secrets

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` (after `npx vercel link`) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

## Tech Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS 3
- Supabase JS client + Supabase Auth
- Vercel

## Related

- [Rondo Plugin](https://github.com/dion-jy/rondo) (`@dion-jy/rondo`) — OpenClaw plugin that syncs data
- [OpenClaw](https://github.com/openclaw/openclaw) — AI agent orchestration platform

## License

MIT
