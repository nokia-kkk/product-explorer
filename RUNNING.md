# Running MiniApp

## The easy way

Double-click one of these in the project folder:

| File | What it does | Address |
| --- | --- | --- |
| `run-dev.bat` | Starts dev mode with hot reload — **use this to browse the app** | http://localhost:5173 |
| `run-prod.bat` | Builds, then serves the optimised app | http://localhost:3000 |

Both install dependencies and import the product data automatically the first
time. Press `Ctrl+C` in the window to stop.

## The manual way

Run these from the project root (`C:\Users\IDEHAL\Desktop\Projects\miniapp`).

First time only:

```bash
npm install
```

```bash
npm run import
```

Then, to start dev mode:

```bash
npm run dev
```

Open http://localhost:5173

For production mode instead (build once, then serve):

```bash
npm run build
```

```bash
npm start
```

Open http://localhost:3000

## All commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Client (5173) + API (3000) with hot reload |
| `npm run build` | Builds client, server, and shared types |
| `npm start` | Serves the built app + API on port 3000 |
| `npm run import` | (Re)downloads product data into `data/app.db` |
| `npm test` | Runs the full test suite |
| `npm run lint` | Checks formatting and code style |
| `npm run typecheck` | Type-checks all three workspaces |

`npm run import` is safe to re-run; it refetches from DummyJSON and replaces the
data. It works offline after the first run, using the cache in
`data/dummyjson-cache/`.

## Changing the port

Both servers take a `PORT` environment variable:

```bash
set PORT=4000 && npm start
```

## Troubleshooting

**`npm install` fails mentioning `better-sqlite3` or Visual Studio.**
`better-sqlite3` is a native module. If npm can't find a prebuilt binary for
your Node version it compiles from source, which needs the
"Desktop development with C++" workload from Visual Studio Build Tools.
Either install that, or use a Node version that has a prebuilt binary
(install Node 20 or 22 from https://nodejs.org).

**`Error: listen EADDRINUSE` (port already in use).**
Something is already on that port — often a previous run. Find and stop every
Node process:

```bash
taskkill //F //IM node.exe
```

This kills *all* Node processes, so save any other Node work first.

**The app loads but shows no products.**
The database is empty. Run:

```bash
npm run import
```

**`npm run lint` suddenly reports thousands of errors about `Delete ␍`.**
Files got checked out with Windows line endings. See `.gitattributes`; fix with:

```bash
npx eslint . --fix
```
