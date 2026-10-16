# 0001 — npm Workspaces Monorepo Structure

**Date**: 2026-10-14
**Status**: Accepted

## Context
The application has three distinct parts: a React frontend (Vite), an Express backend, and shared TypeScript types. They need to share types and be developed/tested together.

## Decision
Use npm workspaces with three packages:
- `packages/client` — React + Vite + TanStack Query
- `packages/server` — Express + TypeScript + SQLite
- `packages/shared` — TypeScript types only (declaration emit)

Root `package.json` defines workspaces and top-level scripts (`dev`, `build`, `test`, `import`).

## Consequences
- ✅ Single `node_modules` hoisted at root (faster installs, less disk)
- ✅ Shared types via `import { Product } from '@shared/types'` — no duplication
- ✅ Independent `tsconfig.json` per package (no project reference complexity)
- ⚠️ Must run commands from root or use `--workspace` flag
- ⚠️ Shared package publishes only types; no runtime code