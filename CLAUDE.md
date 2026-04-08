# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-based Steam game recommender service. Features:
- **Landing page**: Netflix-style UI showing discounted/popular games (no login required)
- **AI recommendations**: Steam OpenID login → library analysis → personalized game picks with AI reasoning (GPT-4o-mini / Claude Haiku / Gemini Flash)
- **Game detail page**: info, pricing, reviews, YouTube videos, Steam link
- **My page**: owned games + playtime

## Monorepo Structure

pnpm + Turborepo workspace:

```
apps/
  web/          # Next.js 16.2.2 frontend (SSR)
packages/
  eslint-config/  # Shared ESLint config with FSD boundary rules
  tsconfig/       # Shared TypeScript configs
```

## Commands

```bash
# Install dependencies
pnpm install

# Development (all apps)
pnpm dev

# Build
pnpm build

# Lint (all packages)
pnpm lint

# Lint with auto-fix (web app only)
cd apps/web && pnpm lint:fix

# Format
pnpm format

# Check formatting
pnpm format:check
```

## Next.js Version Warning

**This project uses Next.js 16.2.2, which has breaking changes from earlier versions.** APIs, conventions, and file structure may differ significantly from training data. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. Heed deprecation notices.

## Architecture: Feature-Sliced Design (FSD)

The `apps/web/src/` directory follows strict FSD layer hierarchy. **Lower layers cannot import from higher layers** — this is enforced by ESLint (`eslint-plugin-boundaries`).

```
app       → can import from: widgets, features, entities, shared
widgets   → can import from: features, entities, shared
features  → can import from: entities, shared
entities  → can import from: shared
shared    → cannot import from any layer above
```

Layer purposes:
- **`app/`** — App entrypoint, global providers, styles, layouts, routes
- **`widgets/`** — Large independent UI blocks (e.g., `ReviewSection`, `HeroSlider`)
- **`features/`** — User interaction units (e.g., `FilterByPlaytime`, `LikeGame`)
- **`entities/`** — Domain models and business logic (e.g., `GameCard`, `useSteamStore`)
- **`shared/`** — Reusable UI components and utilities (e.g., `Button`, `APIClient`)

Each layer exports through a public `index.ts` barrel — import from the layer root, not internal paths.

## System Architecture

```
[Next.js SSR Frontend]
        │
        ▼
[Node.js Backend API]
    │           │
    ▼           ▼
[PostgreSQL]  [AI API]
    │
    ▼
[48h Batch Scheduler → Steam Store API]
```

Data flow: Steam game data is batch-crawled every 48 hours into PostgreSQL. Landing page serves SSR from DB. AI recommendations pre-filter candidates in DB before sending to AI API (cost optimization).

## Coding Conventions

- **Variables / functions**: `camelCase`
- **Components**: `PascalCase` (e.g., `GameCard.tsx`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_REVIEW_COUNT`)

**Import order** (enforced by ESLint): external packages → internal FSD layers (app → widgets → features → entities → shared), with blank lines between groups, alphabetized within groups.

## Commit Convention

```
Feat: Add Steam API integration
Fix: Resolve auth redirect loop
Docs: Update API reference
Style: Fix formatting
Refactor: Extract game filter logic
Test: Add recommendation unit tests
Chore: Update turbo config
```

## Branch Strategy

Git Flow:
- `main` — production-ready, always stable
- `develop` — integration branch for next release
- `feature/[name]` — branch from `develop`, merge back to `develop`
- `hotfix/[name]` — branch from `main`, merge to both `main` and `develop`

## Environment Variables

| Variable | Description |
|---|---|
| `STEAM_API_KEY` | Steam Web API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_API_KEY` | AI model API key |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `NEXTAUTH_SECRET` | Session encryption key |

## Key Libraries

- **TanStack Query** — server state management and caching (game lists, recommendation results, user library)
  - `staleTime` strategy: game list 30min, game detail 1hr, recommendation results `Infinity` (invalidate on re-recommend)

## External APIs

- Steam Web API — game data, user library, playtime
- YouTube Data API v3 — game-related videos and shorts
- Steam OpenID — authentication
- AI API (GPT-4o-mini / Claude Haiku / Gemini Flash) — recommendation reasoning
