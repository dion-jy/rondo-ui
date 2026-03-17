# 🎵 Rondo UI

Cron monitoring dashboard for [OpenClaw](https://github.com/openclaw/openclaw). Deployed on Vercel, reads data from Supabase.

## Architecture

```
OpenClaw Gateway          Supabase          Rondo UI (Vercel)
┌──────────────┐     ┌───────────┐     ┌─────────────────┐
│ rondo plugin │────▶│  Tables   │◀────│  React + Vite   │
│ (push data)  │     │ cron_jobs │     │  Tailwind CSS   │
└──────────────┘     │ cron_runs │     │  @supabase/js   │
                     └───────────┘     └─────────────────┘
```

- **Plugin** (separate repo: [dion-jy/rondo](https://github.com/dion-jy/rondo)) pushes cron data to Supabase
- **This frontend** reads from Supabase and renders the dashboard
- No direct connection between frontend and gateway

## Features

- 📊 Stats overview (active jobs, success rate, token usage)
- 📅 24h timeline with swim lanes per job
- 📋 Job list with status, schedule, and error details
- 📜 Execution log with filtering and expandable summaries
- 🌙 Dark theme, responsive layout

## Setup

### 1. Prerequisites

- Supabase project with tables created (see [rondo/sql/schema.sql](https://github.com/dion-jy/rondo/blob/main/sql/schema.sql))
- Rondo plugin installed and syncing data

### 2. Local Development

```bash
git clone https://github.com/dion-jy/rondo-ui.git
cd rondo-ui
npm install

# Create .env.local
cp .env.example .env.local
# Edit with your Supabase credentials

npm run dev
```

### 3. Deploy to Vercel

```bash
# Via Vercel CLI
npm i -g vercel
vercel

# Or connect GitHub repo in Vercel dashboard
```

**Environment variables** (set in Vercel dashboard):
- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon key

### 4. Custom Domain (optional)

Add your domain in Vercel dashboard → Settings → Domains.

## Deployment

This project uses GitHub Actions to deploy to Vercel via the Vercel CLI (no Vercel GitHub integration required).

- **Pull requests** → automatic preview deployment; the preview URL is posted as a PR comment
- **Push to `main`** → automatic production deployment

### Required GitHub Secrets

Set these in your repo under **Settings → Secrets and variables → Actions**:

| Secret | How to get it |
|--------|---------------|
| `VERCEL_TOKEN` | Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Run `npx vercel link` locally, then check `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Same file (`.vercel/project.json`) → `projectId` |

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 3
- Supabase JS client
- Vercel (deployment)

## Related

- [Rondo Plugin](https://github.com/dion-jy/rondo) — OpenClaw plugin that syncs data to Supabase
- [OpenClaw](https://github.com/openclaw/openclaw) — AI agent orchestration platform

## License

MIT
