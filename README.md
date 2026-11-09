# AegisTrust — Relational Threat Graph Intelligence Engine

A local-first Web2 phishing-research MVP based on the supplied specification. It combines a Next.js researcher dashboard, Express API, PostgreSQL threat graph, Redis scan cache, public-host DNS/TXT/TLS/RDAP recon worker, isolated Playwright worker, Gemini assessment adapter, Socket.io event feed, and Chrome Manifest V3 extension. A dashboard register/login screen uses bcrypt password hashes and bearer-token checks on scan and graph endpoints.

This is a development foundation, not a production threat-intelligence service. It intentionally avoids stealth plugins, credential submission, and attempts to bypass bot protections. Scan only public URLs that you are authorized to investigate. The service rejects local/private/reserved destinations and applies request limits, but its browser worker still requires a properly isolated container and outbound-network controls before exposure to untrusted users.

## Requirements

Use Node.js 20 or newer, pnpm 9, and Docker Desktop (for local PostgreSQL and Redis). Dependencies are declared in `pnpm-lock.yaml`. If pnpm is not installed on your machine, invoke the pinned version temporarily with `npm exec --yes --package=pnpm@9.15.9 -- pnpm <command>`; this does not require installing pnpm globally.

## Start locally

The original project folder has a private, git-ignored `.env` with a cryptographically generated JWT secret. It is intentionally excluded from the downloadable ZIP and source listing. If setting up from the ZIP, make a private environment file and generate a fresh secret in PowerShell:

```powershell
Copy-Item .env.example .env
$secret = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
$text = (Get-Content -Raw .env).Replace('REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS', $secret)
[System.IO.File]::WriteAllText((Resolve-Path .env), $text, [System.Text.UTF8Encoding]::new($false))
```

Keep `.env` private. `GEMINI_API_KEY` is optional: leave it blank for the labelled heuristic fallback, or add a key privately to `.env` to enable Gemini assessment. The bundled local PostgreSQL credentials are disposable Compose defaults only.

From PowerShell at the project root, start PostgreSQL and Redis, install the locked dependencies, apply the schema, then start all application services:

```powershell
docker compose up -d
npm exec --yes --package=pnpm@9.15.9 -- pnpm install
npm exec --yes --package=pnpm@9.15.9 -- pnpm db:push
npm exec --yes --package=pnpm@9.15.9 -- pnpm dev
```

The dashboard is at `http://localhost:3000`, the API at `http://localhost:4000`, recon worker at `http://localhost:4101`, and sandbox worker at `http://localhost:4102`. Docker Compose starts PostgreSQL and Redis; Turbo starts the dashboard, gateway, recon service, sandbox service, and extension development server. The API and workers bind to loopback by default to avoid exposing local services to the LAN. Register your own local user from the dashboard on first visit. Passwords require at least 12 characters. The dashboard holds an eight-hour JWT in the current browser's local storage and offers a sign-out button.

Validation commands:

```powershell
npm exec --yes --package=pnpm@9.15.9 -- pnpm typecheck
npm exec --yes --package=pnpm@9.15.9 -- pnpm build
npm exec --yes --package=pnpm@9.15.9 -- pnpm --filter @aegistrust/extension build
```

The monorepo type check and production frontend/extension build have been run successfully. A live database schema push and full scan were not run on the authoring computer because Docker Desktop and local PostgreSQL/Redis are unavailable there.

## Chrome extension

After building, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `apps/extension/dist`. The extension uses Chrome's declarativeNetRequest API and syncs confirmed phishing domains from the read-only `/api/threats` feed; it listens to Socket.io `threat:new` events for new phishing reports. Its default endpoint is `http://localhost:4000`; change `VITE_AEGIS_API_URL` in `.env` before building if needed. For production, restrict API CORS using `EXTENSION_ORIGINS` and review the extension's website host permissions against the distribution requirements.

## API and data

`POST /api/scan` and `GET /api/graph` require a valid bearer JWT. `POST /api/register` and `POST /api/login` are available for account creation and sign-in. `GET /api/threats` exposes only active suspicious/phishing domain indicators for extension synchronization. Clean scans are cached for 15 minutes; confirmed phishing scans are cached without expiry. The score combines model confidence, related graph indicators, TLS presence, credential-form detection, and scan warnings. It is an investigative triage signal, not a guarantee of safety.

The Drizzle schema defines `users`, `ips`, `certificates`, `dom_hashes`, and `threat_events`. User accounts are local MVP accounts; OAuth, password reset, email verification, account recovery, administrative roles, and refresh/revocation support are not implemented.

## Deployment choices still needed

This bundle is configured for local development. A public hosted instance requires a hosting target and public domain/API URL; managed PostgreSQL and Redis URLs; the exact web origin; the deployed worker URLs; a deployment-specific JWT secret; and an explicit extension origin if Chrome-extension access is enabled. Keep credentials in the hosting provider's secret manager, not the repository. A Gemini key remains optional locally, but must be securely supplied if AI assessment is required. Do not expose the browser worker directly to the internet; run it behind a hardened isolated container with restricted egress and resource limits.

## Repository map

```text
apps/web/                 Next.js scanner, login/register gate, report, live graph
apps/extension/           Chrome MV3 popup, DNR blocklist, configurable Socket.io sync
services/api-gateway/     orchestration, JWT auth, graph/threat APIs, Redis, Socket.io
services/recon-worker/    DNS/TXT/TLS/RDAP and historical indicator lookup
services/sandbox-worker/  isolated Playwright capture, DOM hash, Gemini adapter
packages/core/            shared types, URL safety, canonicalization, risk scoring
packages/db/              PostgreSQL Drizzle schema, client, migration config
```
