# 0001 — npm Workspaces Monorepo Structure

**Date**: 2026-10-14
**Status**: Accepted

## Context
The application has three distinct parts: a React frontend (Vite), an Express backend, and shared TypeScript types. They need to share types and be developed/tested together.

## Decision
Use npm workspaces with three packages:
- `packages/client` — React + Vite + TanStack Query
- `packages/server` — Express + TypeScript + SQLite
- `packages/shared` — API contracts: types **and** the runtime constants that both sides must agree on

Root `package.json` defines workspaces and top-level scripts (`dev`, `build`, `test`, `import`).

One specifier, `@miniapp/shared`, is used by both consumers. The client resolves it to source
via a Vite/Vitest/tsconfig alias so the dev loop never needs a shared rebuild; the server
resolves it through `package.json` to the built `dist`.

## Consequences
- ✅ Single `node_modules` hoisted at root (faster installs, less disk)
- ✅ Shared contract via `import { Product } from '@miniapp/shared'` — no duplication
- ✅ A shared enum cannot drift: `PRODUCT_SORT_FIELDS` feeds the server's zod schema and
  types the client's sort control from one list
- ✅ Independent `tsconfig.json` per package (no project reference complexity)
- ⚠️ Must run commands from root or use `--workspace` flag
- ⚠️ Shared carries runtime code now, so it is built before the server runs. The client is
  exempt because its alias points at source.