# Nosthenticator

## Overview

Nosthenticator is a secure cross-platform authenticator that handles standard OTP accounts (TOTP/HOTP) and Nostr identities in one place, with optional backup and QR-based import/export. Think Authy meets 1Password, but with Nostr superpowers.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS, shadcn/ui, Wouter routing, warm authenticator aesthetic)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **TOTP generation**: Custom Node.js crypto implementation (RFC 6238)
- **Build**: esbuild

## Architecture

```
artifacts/
  nosthenticator/   — React+Vite frontend (4-tab mobile-first authenticator UI)
  api-server/       — Express 5 REST API
lib/
  db/               — PostgreSQL schema via Drizzle ORM
  api-spec/         — OpenAPI spec (source of truth for all routes)
  api-client-react/ — Generated React Query hooks (via Orval)
  api-zod/          — Generated Zod validation schemas (via Orval)
```

## UI Tabs

- **Codes** (`/`) — TOTP/HOTP rolling codes with SVG countdown rings, search, favorites, auto-refresh every 5s
- **Nostr** (`/nostr`) — Nostr identities + pending auth approval queue (Approve/Reject with risk badges)
- **Vault** (`/vault`) — Stats, export bundle (base64), import from bundle
- **Activity** (`/activity`) — Notification-feed style event log

## Database Tables

- `credentials` — TOTP, HOTP, and Nostr credential records (type, secret, issuer, npub, favorite, etc.)
- `nostr_requests` — Pending/completed Nostr authorization requests
- `activity_log` — Event log (code views, approvals, rejections, imports/exports)

## API Endpoints

- `GET /api/health` — Health check
- `GET/POST /api/credentials` — List / create credentials
- `GET/PUT/DELETE /api/credentials/:id` — Get / update / delete credential
- `POST /api/credentials/:id/favorite` — Toggle favorite
- `GET /api/codes` — Live TOTP/HOTP codes for all OTP credentials (refetch every 5s)
- `GET /api/codes/:id` — Live code for a single credential
- `GET/POST /api/nostr/requests` — List / create Nostr auth requests
- `POST /api/nostr/requests/:id/approve` — Approve a pending request
- `POST /api/nostr/requests/:id/reject` — Reject a pending request
- `GET /api/activity` — Paginated activity log
- `GET /api/vault/stats` — Aggregate stats
- `POST /api/vault/export` — Export all credentials as base64 bundle
- `POST /api/vault/import` — Import credentials from bundle

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- After changing `lib/api-spec/openapi.yaml`, run codegen in `lib/api-client-react` and `lib/api-zod`, then rebuild both with `npx tsc -b`
- DB tables are created via raw SQL (drizzle-kit push doesn't handle renames well)

## Important Notes

- TOTP codes are generated server-side using HMAC-SHA1 (RFC 6238) in `artifacts/api-server/src/lib/totp.ts`
- All lib packages (db, api-zod, api-client-react) use TypeScript composite mode — run `npx tsc -b` in each after changes
- The api-zod barrel (`lib/api-zod/src/index.ts`) exports only from `./generated/api` (not `./generated/types`) to avoid name collisions
- Demo secrets all use `JBSWY3DPEHPK3PXP` — replace with real base32 secrets in production
