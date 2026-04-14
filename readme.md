# Nosthenticator

## Overview

Nosthenticator is a Nostr-native signing device companion — the "Coldcard of Nostr identities." It provides hardware-class signing security with explicit confirmation required for every operation, plus an append-only cryptographic audit log.

## Local browser release (v0.0.2)

A clean, dependency-free browser build is available at:

- `release/v0.0.2/index.html`

Run locally:

```bash
cd release/v0.0.2
python3 -m http.server 4173
# open http://localhost:4173
```

This release works entirely in the browser and stores data in `localStorage`.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS, shadcn/ui, Recharts, Wouter)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Architecture

```
artifacts/
  nosthenticator/   — React+Vite frontend (dark mode default, monospace hacker aesthetic)
  api-server/       — Express 5 REST API
lib/
  db/               — PostgreSQL schema via Drizzle ORM
  api-spec/         — OpenAPI spec (source of truth)
  api-client-react/ — Generated React Query hooks
  api-zod/          — Generated Zod validation schemas
release/
  v0.0.2/           — Standalone browser release (single HTML file)
```

## Features

- **Dashboard** — Stats overview (total keys, pending requests, signature count, activity chart)
- **Identities** — Register and manage npub identities with signing history
- **Pending Authorizations** — Live queue of signing requests with hex event preview, approve/reject with one click
- **Audit Log** — Append-only hash-chained log of every signing operation (tamper-evident)
- **Settings** — Transport and security model documentation

## Database Tables

- `nostr_keys` — Stored npub identities
- `signing_requests` — Pending/completed signing requests
- `audit_log` — Tamper-evident hash-chained signing history

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Design Principles

- No profiles, no metadata, no relay connections — identity-less by design
- Every signing operation requires explicit user confirmation with hex preview
- Append-only audit log with hash chain integrity
- Air-gap friendly (QR transport planned)
- Minimal V0.1 scope: key storage, signing confirmation, audit log

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
