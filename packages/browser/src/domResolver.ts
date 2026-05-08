export function resolveTarget(target: EventTarget | null): string {
  if (!target || !(target instanceof Element)) return 'unknown'

  const el = target as Element
  const tag = el.tagName.toLowerCase()

  const actName = el.getAttribute('data-act')
  if (actName) return `${tag}[data-act="${actName}"]`

  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel) return `${tag}[aria-label="${ariaLabel}"]`

  if (el.id) return `${tag}#${el.id}`

  if (el.classList.length > 0) {
    const classes = Array.from(el.classList).slice(0, 2).join('.')
    return `${tag}.${classes}`
  }

  return tag
}

export function resolveActName(target: EventTarget | null): string | undefined {
  if (!target || !(target instanceof Element)) return undefined
  return (target as Element).getAttribute('data-act') ?? undefined
}

export function resolveBoundary(target: EventTarget | null): string | undefined {
  if (!target || !(target instanceof Element)) return undefined
  let el: Element | null = target as Element
  while (el) {
    const boundary = el.getAttribute('data-act-boundary')
    if (boundary) return boundary
    el = el.parentElement
  }
  return undefined
}

export function isSensitive(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  const el = target as Element
  if (el.getAttribute('data-act-sensitive') === 'true') return true
  if (el instanceof HTMLInputElement && el.type === 'password') return true
  return false
}
