# Rondo UI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

React dashboard for monitoring OpenClaw cron jobs and agent sessions.

**Live:** [rondo-ui.vercel.app](https://rondo-ui.vercel.app)

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
- **5 dark themes** — Midnight, Nord, Solarized, Dracula, Rosé Pine
- **Responsive** — mobile-friendly with bottom navigation

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
