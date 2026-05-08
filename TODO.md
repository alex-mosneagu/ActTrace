# ActTrace — Vibe Coding Prompt (v0.0.1)

## What You're Building

**ActTrace** is a zero-config TypeScript browser library for frontend interaction tracing.

One import. No config required. It intercepts native browser events, network calls, and DOM mutations — then correlates them into a single readable trace per user interaction.

```ts
import { startActTrace } from '@acttrace/browser'

startActTrace()
```

That's it. The moment a user clicks something, the console shows:

```
▶ ActTrace #1 — customer.save
  event    click
  target   button[data-act="customer.save"]
  boundary CustomerModule
  network  POST /api/customers → 201 (142ms)
  dom      7 mutations
  duration 318ms
```

---

## Monorepo Structure

```
acttrace/
├─ package.json                  ← root (pnpm workspace)
├─ pnpm-workspace.yaml
├─ tsconfig.json                 ← base TS config
├─ README.md
├─ packages/
│  └─ browser/
│     ├─ package.json            ← name: @acttrace/browser
│     ├─ tsup.config.ts
│     └─ src/
│        ├─ index.ts             ← public exports only
│        ├─ types.ts
│        ├─ startActTrace.ts
│        ├─ stopActTrace.ts
│        ├─ eventObserver.ts
│        ├─ fetchObserver.ts
│        ├─ xhrObserver.ts       ← optional in v0.0.1
│        ├─ mutationObserver.ts
│        ├─ traceStore.ts
│        ├─ domResolver.ts
│        ├─ sanitizer.ts
│        ├─ reporter.ts
│        └─ utils.ts
│     └─ test/
│        ├─ domResolver.test.ts
│        ├─ sanitizer.test.ts
│        └─ traceStore.test.ts
└─ examples/
   └─ vite-demo/
      ├─ index.html
      ├─ package.json
      └─ src/
         └─ main.ts
```

---

## Toolchain

| Tool | Purpose |
|------|---------|
| `pnpm` | package manager + workspace |
| `TypeScript` | strict mode |
| `tsup` | build (ESM + CJS, .d.ts) |
| `Vitest` | unit tests |
| `jsdom` | test environment |
| `Vite` | demo app dev server |

No React. No framework. No backend. No dashboard.

---

## Public API

### `startActTrace(options?): ActTraceController`

```ts
type ActTraceOptions = {
  appName?: string           // label shown in console output
  enabled?: boolean          // default: true
  debug?: boolean            // verbose internal logs

  capture?: boolean          // listen in capture phase (default: true)
  bubble?: boolean           // listen in bubble phase (default: true)
  events?: string[]          // default: ['click', 'input', 'change', 'submit']
  traceWindowMs?: number     // correlation window (default: 2000)

  observeFetch?: boolean     // default: true
  observeXHR?: boolean       // default: false (optional in v0.0.1)
  observeMutations?: boolean // default: true
  observeErrors?: boolean    // default: false (optional in v0.0.1)

  reporter?: ActTraceReporter  // default: consoleReporter
}

type ActTraceController = {
  stop: () => void           // remove all listeners, restore globals
  flush: () => void          // force-close the active trace immediately
  getSnapshot: () => ActTrace[]  // return all completed traces
}
```

### `stopActTrace(): void`

Convenience function. Equivalent to calling `controller.stop()`.

---

## Core Types

```ts
type ActTrace = {
  id: string
  appName?: string
  startedAt: number
  endedAt?: number
  durationMs?: number

  event: {
    type: string
    phase: 'capture' | 'bubble'
    target: string          // resolved selector string
    actName?: string       // from data-act attribute
    boundary?: string       // from nearest data-act-boundary ancestor
  }

  network: ActNetworkCall[]
  mutations: ActDomMutation[]
  errors: ActError[]
}

type ActNetworkCall = {
  method: string
  url: string
  status?: number
  durationMs?: number
  error?: string
}

type ActDomMutation = {
  added: number
  removed: number
  attributeChanged: number
}

type ActError = {
  message: string
  source?: string
}

type ActTraceReporter = {
  report: (trace: ActTrace) => void
}
```

---

## Module Behaviour

### `eventObserver.ts`
- Attach listeners to `document` for `['click', 'input', 'change', 'submit']`
- Support both capture and bubble phase (configurable)
- On each event → call `traceStore.createTrace(event)`
- Call `domResolver.resolveTarget(event.target)` to build selector string
- Walk DOM ancestors to find nearest `data-act-boundary`
- Clean up both listeners on `stop()`

### `fetchObserver.ts`
- Save reference to `window.fetch` before patching
- Wrap with a proxy that:
  - Records `method`, `url`
  - Records `status` and `durationMs` after response
  - Calls `traceStore.appendNetworkCall(...)` to attach to active trace
  - Never logs: request body, Authorization headers, Cookie headers, Set-Cookie
- Restore `window.fetch` on `stop()`
- Guard: if `startActTrace()` is called multiple times, do NOT re-patch

### `mutationObserver.ts`
- Create a `MutationObserver` watching `document.body` (childList + subtree + attributes)
- On mutations → count `added`, `removed`, `attributeChanged`
- Call `traceStore.appendMutation(...)` to attach to active trace
- Disconnect on `stop()`
- Guard: if `document.body` is null at startup, defer with `DOMContentLoaded`

### `traceStore.ts`
- Maintain `activeTrace: ActTrace | null`
- `createTrace(event)` → closes any previous open trace, creates new one
- `appendNetworkCall(call)` → attaches to `activeTrace` if within `traceWindowMs`
- `appendMutation(mutation)` → attaches to `activeTrace` if within `traceWindowMs`
- `closeTrace()` → sets `endedAt`, calculates `durationMs`, sends to `reporter.report(trace)`, pushes to history
- Auto-close: use `setTimeout(closeTrace, traceWindowMs)` from when trace was created
- `getSnapshot()` → return copy of trace history array

### `domResolver.ts`
- Input: `EventTarget | Element`
- Output: human-readable selector string
- Priority order:
  1. `data-act` → `button[data-act="customer.save"]`
  2. `aria-label` → `button[aria-label="Save"]`
  3. `id` → `button#save-btn`
  4. class names (first 2 only) → `button.btn.primary`
  5. tag name fallback → `button`

### `sanitizer.ts`
- Input: any object
- Hard rules (never log, ever):
  - Input element values
  - `Authorization` header
  - `Cookie` / `Set-Cookie` headers
  - Any field named `password`, `token`, `secret`, `key` (case-insensitive)
  - Request/response body
- `data-act-sensitive="true"` on an element → skip recording that event's target details

### `reporter.ts` (console reporter)
```
▶ ActTrace #12 — customer.save
  event    click
  target   button[data-act="customer.save"]
  boundary CustomerModule
  network  POST /api/customers → 201 (142ms)
  dom      7 mutations (3 added, 1 removed, 3 attr)
  duration 318ms
```
- Use `console.groupCollapsed(...)` + `console.log(...)` + `console.groupEnd()`
- Each section only printed if it has data (no empty `network  —`)

---

## Optional HTML Attributes

These are zero-config by default but improve trace readability when added:

```html
<!-- Name a specific interaction -->
<button data-act="customer.save">Save</button>

<!-- Group interactions into a named module boundary -->
<section data-act-boundary="CustomerModule">
  <button data-act="customer.save">Save</button>
</section>

<!-- Mark sensitive fields — target details will be omitted from trace -->
<input type="password" />
<input data-act-sensitive="true" />
```

---

## Vite Demo App (`examples/vite-demo`)

The demo must show all core features working together:

```html
<!-- index.html should include: -->
<section data-act-boundary="CustomerModule">
  <input placeholder="Customer name" />
  <input type="password" placeholder="Password (sensitive)" />
  <button data-act="customer.save">Save Customer</button>
</section>

<section data-act-boundary="SearchModule">
  <input data-act="search.query" placeholder="Search..." />
</section>

<form data-act-boundary="LoginForm">
  <input type="text" name="username" />
  <input type="password" name="password" />
  <button type="submit" data-act="auth.login">Login</button>
</form>
```

```ts
// main.ts
import { startActTrace } from '@acttrace/browser'

const ft = startActTrace({ appName: 'acttrace-demo', debug: true })

// Simulate fake fetch on button click
document.querySelector('[data-act="customer.save"]')?.addEventListener('click', async () => {
  await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test' })
  })
  // Simulate DOM update
  const list = document.getElementById('customer-list')
  if (list) {
    const item = document.createElement('li')
    item.textContent = 'New Customer'
    list.appendChild(item)
  }
})
```

The demo must produce a readable trace in the console showing: event, network call, and DOM mutations. That is the first magical moment.

---

## Tests (Vitest + jsdom)

### `domResolver.test.ts`
- Element with `data-act` → returns `tag[data-act="..."]`
- Element with `aria-label` → returns `tag[aria-label="..."]`
- Element with `id` → returns `tag#id`
- Element with classes → returns `tag.class1.class2`
- Plain element → returns tag name

### `sanitizer.test.ts`
- Input element → value is never recorded
- Object with `password` key → value is redacted
- Object with `Authorization` key → value is redacted
- Clean object → passes through unchanged

### `traceStore.test.ts`
- `createTrace()` → creates trace with ID and `startedAt`
- `appendNetworkCall()` → attaches to active trace
- After `traceWindowMs` → trace is closed and passed to reporter
- Two rapid events → second event closes first trace

---

## Safety Checklist (implement all of these)

- [ ] Multiple `startActTrace()` calls do NOT double-patch `fetch`
- [ ] `stop()` removes ALL event listeners (both capture + bubble)
- [ ] `stop()` restores `window.fetch` to original
- [ ] `MutationObserver` disconnects on `stop()`
- [ ] If `document.body` is null at init, defer observation
- [ ] If `window.fetch` is undefined, skip patching gracefully
- [ ] Input values are NEVER stored anywhere
- [ ] Auth/cookie headers are NEVER stored anywhere
- [ ] Traces expire even if no close event occurs (auto-timeout)
- [ ] TypeScript strict mode — no `any` except where truly unavoidable
- [ ] `tsup` builds to both ESM and CJS with `.d.ts` types

---

## What NOT to Build

Do not build any of these in v0.0.1:

- Dashboard or UI
- React / Vue adapter
- Session replay
- Screenshots or DOM snapshots
- OpenTelemetry / Grafana export
- CI reporter or GitHub PR comments
- Backend or server component
- Cloud storage or remote reporting
- Error boundary tracking
- Web Worker tracing

Keep the surface area tiny. One script. One console output. That's the MVP.

---

## Acceptance Criteria

The build is complete when ALL of these pass:

- [ ] `startActTrace()` runs without errors
- [ ] Clicking a button creates a trace in console
- [ ] `input`, `change`, and `submit` events also create traces
- [ ] `fetch` calls are attached to the active trace
- [ ] DOM mutations are counted and shown
- [ ] Console output is readable and grouped
- [ ] `stop()` fully cleans up (no lingering listeners or patched globals)
- [ ] Demo app runs with `pnpm dev` from `examples/vite-demo`
- [ ] All 3 test files pass with `pnpm test`
- [ ] Package builds with `pnpm build` in `packages/browser`
- [ ] README explains the concept in under 100 words
- [ ] README has working JS and TS usage examples
- [ ] README has CDN script tag example for plain HTML users

---

## README.md Spec

Generate a `README.md` at the repo root. It must be friendly to both **JavaScript** and **TypeScript** users, and also to people who don't use a bundler at all.

### Structure

````md
# ActTrace

> Drop in one script. Understand every frontend interaction.

One-paragraph description: what it does, why it matters, who it's for.

## Install

```bash
npm install @acttrace/browser
# or
pnpm add @acttrace/browser
# or
yarn add @acttrace/browser
```

## Quick Start

### TypeScript

```ts
import { startActTrace } from '@acttrace/browser'

startActTrace()
```

### JavaScript (ESM)

```js
import { startActTrace } from '@acttrace/browser'

startActTrace()
```

### JavaScript (CommonJS)

```js
const { startActTrace } = require('@acttrace/browser')

startActTrace()
```

### Plain HTML (CDN / no bundler)

```html
<script type="module">
  import { startActTrace } from 'https://cdn.jsdelivr.net/npm/@acttrace/browser/dist/index.mjs'
  startActTrace()
</script>
```

## What You'll See

When a user clicks a button, the browser console shows:

```
▶ ActTrace #1 — customer.save
  event    click
  target   button[data-act="customer.save"]
  boundary CustomerModule
  network  POST /api/customers → 201 (142ms)
  dom      7 mutations
  duration 318ms
```

## Optional Config

### TypeScript

```ts
import { startActTrace } from '@acttrace/browser'
import type { ActTraceOptions } from '@acttrace/browser'

const options: ActTraceOptions = {
  appName: 'my-app',
  traceWindowMs: 2000,
  debug: true,
}

const ft = startActTrace(options)

// later
ft.stop()
```

### JavaScript

```js
import { startActTrace } from '@acttrace/browser'

const ft = startActTrace({
  appName: 'my-app',
  traceWindowMs: 2000,
  debug: true,
})

// later
ft.stop()
```

## HTML Hints (optional)

ActTrace works with zero markup changes. But adding these attributes makes traces more readable:

```html
<!-- Name an interaction -->
<button data-act="customer.save">Save</button>

<!-- Group interactions into a named boundary -->
<section data-act-boundary="CustomerModule">
  <button data-act="customer.save">Save</button>
</section>

<!-- Mark a field as sensitive — its details are omitted from traces -->
<input type="password" />
<input data-act-sensitive="true" />
```

## API

### `startActTrace(options?): ActTraceController`

| Option | Type | Default | Description |
|---|---|---|---|
| `appName` | `string` | — | Label shown in console output |
| `enabled` | `boolean` | `true` | Enable/disable tracing |
| `debug` | `boolean` | `false` | Verbose internal logs |
| `capture` | `boolean` | `true` | Listen in capture phase |
| `bubble` | `boolean` | `true` | Listen in bubble phase |
| `events` | `string[]` | `['click','input','change','submit']` | DOM events to observe |
| `traceWindowMs` | `number` | `2000` | Correlation window in ms |
| `observeFetch` | `boolean` | `true` | Patch and trace fetch calls |
| `observeXHR` | `boolean` | `false` | Patch and trace XHR calls |
| `observeMutations` | `boolean` | `true` | Count DOM mutations |

### `ActTraceController`

```ts
ft.stop()           // remove all listeners, restore patched globals
ft.flush()          // force-close the current open trace immediately
ft.getSnapshot()    // return array of all completed ActTrace objects
```

### `stopActTrace()`

Global convenience function — same as calling `ft.stop()`.

```ts
import { startActTrace, stopActTrace } from '@acttrace/browser'

startActTrace()
// ...
stopActTrace()
```

## TypeScript Support

ActTrace is written in TypeScript. All types are exported:

```ts
import type {
  ActTrace,
  ActTraceOptions,
  ActTraceController,
  ActTraceReporter,
  ActNetworkCall,
  ActDomMutation,
  ActError,
} from '@acttrace/browser'
```

No `@types/` package needed.

## Privacy & Safety

ActTrace never records:

- Input field values
- `Authorization` or `Cookie` headers
- Request or response bodies
- Fields named `password`, `token`, `secret`, or `key`
- Any element marked with `data-act-sensitive="true"`

Review these defaults before using in production environments.

## Status

**Experimental — v0.0.1**

Do not use in production without reviewing privacy and performance settings.

## License

MIT
````

### README Rules

- All code blocks must be valid and copy-pasteable
- JS and TS examples must both be present for any non-trivial usage
- The CDN/script tag example must work with no bundler
- The API table must match the actual `ActTraceOptions` type exactly
- Do NOT put TypeScript-only syntax in the JS examples (no `: Type` annotations)
- The "What You'll See" console block must match the actual reporter output format
- Keep tone direct and developer-focused — no marketing fluff beyond the tagline