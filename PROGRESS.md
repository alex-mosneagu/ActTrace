# ActTrace — Progress Tracker

## Status: ✅ v0.0.1 Complete + Dashboard & Grafana examples added

---

## Phase 1 — Monorepo Scaffold ✅

- [x] Root `package.json` (pnpm workspace)
- [x] `pnpm-workspace.yaml`
- [x] Root `tsconfig.json`

## Phase 2 — `@acttrace/browser` Package Config ✅

- [x] `packages/browser/package.json`
- [x] `packages/browser/tsup.config.ts`
- [x] `packages/browser/vitest.config.ts`
- [x] `packages/browser/tsconfig.json`

## Phase 3 — Core Source Files ✅

- [x] `src/types.ts` — all public types
- [x] `src/utils.ts` — generateId()
- [x] `src/domResolver.ts` — selector resolution + boundary/actName/sensitive helpers
- [x] `src/sanitizer.ts` — header + object sanitization
- [x] `src/reporter.ts` — consoleReporter (grouped console output)
- [x] `src/traceStore.ts` — active trace lifecycle management
- [x] `src/eventObserver.ts` — DOM event listeners (capture phase by default)
- [x] `src/fetchObserver.ts` — fetch patch with multi-instance safety guard
- [x] `src/mutationObserver.ts` — MutationObserver wrapper (defers if body is null)
- [x] `src/xhrObserver.ts` — XHR stub (optional v0.0.1)
- [x] `src/startActTrace.ts` — main entry, wires all observers
- [x] `src/stopActTrace.ts` — convenience stop function
- [x] `src/index.ts` — public re-exports only

## Phase 4 — Tests ✅

- [x] `test/domResolver.test.ts` — 7 tests
- [x] `test/sanitizer.test.ts` — 11 tests
- [x] `test/traceStore.test.ts` — 7 tests
- **Total: 25 tests, all passing**

## Phase 5 — Vite Demo App ✅

- [x] `examples/vite-demo/package.json`
- [x] `examples/vite-demo/vite.config.ts` (aliases `@acttrace/browser` → source)
- [x] `examples/vite-demo/index.html` (CustomerModule, SearchModule, LoginForm)
- [x] `examples/vite-demo/src/main.ts`

## Phase 6 — README ✅

- [x] `README.md` — JS + TS + CDN examples, full API table, privacy section

## Phase 7 — Verification ✅

- [x] `pnpm install` — 143 packages installed, esbuild approved
- [x] `pnpm build` — ESM (`dist/index.js`) + CJS (`dist/index.cjs`) + types (`dist/index.d.ts`) emitted
- [x] `pnpm test` — 25/25 tests pass across 3 files
- [x] `pnpm dev` — vite-demo runs at http://localhost:5173
- [x] Dashboard example — server at http://localhost:3001, UI at http://localhost:5174
- [x] Grafana example — vite at http://localhost:5175, Loki+Grafana via docker-compose

## Phase 8 — Additional Examples ✅

### Dashboard (`examples/dashboard`)
- [x] `server/index.ts` — Express: `POST /api/traces`, `GET /api/events` (SSE), fake `/api/customers`
- [x] `src/httpReporter.ts` — custom reporter that POSTs traces to the server
- [x] `src/demo.ts` — ActTrace wired to HTTP reporter
- [x] `src/dashboard.ts` — SSE consumer, live card renderer, stats bar
- [x] `index.html` — interaction demo page
- [x] `dashboard.html` — dark-theme live trace dashboard

### Grafana (`examples/grafana`)
- [x] `src/lokiReporter.ts` — formats traces as Loki push API payload (JSON log lines)
- [x] `src/main.ts` — ActTrace wired to Loki reporter
- [x] `index.html` — demo page with setup instructions
- [x] `docker-compose.yml` — Grafana + Loki services (no login, auto-provisioned)
- [x] `provisioning/datasources/loki.yaml` — Loki datasource auto-wired into Grafana

---

## Safety Checklist ✅

- [x] Multiple `startActTrace()` calls do NOT double-patch `fetch` (module-level Set + ref count)
- [x] `stop()` removes ALL event listeners (handlers array tracks type + useCapture)
- [x] `stop()` restores `window.fetch` to original (restored when activeStores empties)
- [x] `MutationObserver` disconnects on `stop()`
- [x] `document.body` null → defers observation to `DOMContentLoaded`
- [x] `window.fetch` undefined → skip patching gracefully
- [x] Input values NEVER stored (only URL + method + status recorded from fetch)
- [x] Auth/cookie headers NEVER stored (only URL intercepted, not headers)
- [x] Traces auto-expire via `setTimeout(closeTrace, traceWindowMs)`
- [x] TypeScript strict mode — no `any` in source files
- [x] `tsup` builds ESM + CJS + `.d.ts`
