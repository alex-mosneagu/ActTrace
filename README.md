# ActTrace

> Drop in one script. Understand every frontend interaction.

ActTrace is a zero-config TypeScript browser library that intercepts DOM events, network calls, and DOM mutations — then correlates them into a single readable trace per user interaction. Drop it into any web app and instantly see what happens when a user clicks a button, submits a form, or types in a field. No dashboard, no backend, no framework required.

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
  dom      7 mutations (3 added, 1 removed, 3 attr)
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
