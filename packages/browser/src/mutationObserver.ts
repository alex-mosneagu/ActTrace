import type { ResolvedOptions } from './types'
import type { TraceStore } from './traceStore'

export function createMutationObserver(options: ResolvedOptions, store: TraceStore) {
  let observer: MutationObserver | null = null

  function startObserving() {
    if (!document.body) return

    observer = new MutationObserver((mutations) => {
      let added = 0
      let removed = 0
      let attributeChanged = 0

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          added += mutation.addedNodes.length
          removed += mutation.removedNodes.length
        } else if (mutation.type === 'attributes') {
          attributeChanged++
        }
      }

      if (added + removed + attributeChanged > 0) {
        store.appendMutation({ added, removed, attributeChanged })
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }

  function start() {
    if (!options.observeMutations) return

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', startObserving, { once: true })
    } else {
      startObserving()
    }
  }

  function stop() {
    observer?.disconnect()
    observer = null
  }

  return { start, stop }
}
