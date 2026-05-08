import { describe, it, expect } from 'vitest'
import { resolveTarget } from '../src/domResolver'

describe('resolveTarget', () => {
  it('returns tag[data-act] selector when data-act is set', () => {
    const el = document.createElement('button')
    el.setAttribute('data-act', 'customer.save')
    expect(resolveTarget(el)).toBe('button[data-act="customer.save"]')
  })

  it('returns tag[aria-label] selector when aria-label is set', () => {
    const el = document.createElement('button')
    el.setAttribute('aria-label', 'Save')
    expect(resolveTarget(el)).toBe('button[aria-label="Save"]')
  })

  it('returns tag#id selector when id is set', () => {
    const el = document.createElement('button')
    el.id = 'save-btn'
    expect(resolveTarget(el)).toBe('button#save-btn')
  })

  it('returns tag with first two classes when classes are set', () => {
    const el = document.createElement('button')
    el.className = 'btn primary extra'
    expect(resolveTarget(el)).toBe('button.btn.primary')
  })

  it('returns tag name as fallback for plain elements', () => {
    const el = document.createElement('button')
    expect(resolveTarget(el)).toBe('button')
  })

  it('prioritises data-act over aria-label', () => {
    const el = document.createElement('button')
    el.setAttribute('data-act', 'save')
    el.setAttribute('aria-label', 'Save button')
    expect(resolveTarget(el)).toBe('button[data-act="save"]')
  })

  it('returns unknown for null target', () => {
    expect(resolveTarget(null)).toBe('unknown')
  })
})
