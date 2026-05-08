import { describe, it, expect } from 'vitest'
import { sanitizeHeaders, sanitizeObject } from '../src/sanitizer'

describe('sanitizeHeaders', () => {
  it('redacts Authorization header', () => {
    expect(sanitizeHeaders({ Authorization: 'Bearer token123' })).toEqual({
      Authorization: '[redacted]',
    })
  })

  it('redacts Cookie header (case-insensitive)', () => {
    expect(sanitizeHeaders({ cookie: 'session=abc' })).toEqual({
      cookie: '[redacted]',
    })
  })

  it('redacts Set-Cookie header', () => {
    expect(sanitizeHeaders({ 'Set-Cookie': 'id=1; HttpOnly' })).toEqual({
      'Set-Cookie': '[redacted]',
    })
  })

  it('passes through non-sensitive headers unchanged', () => {
    expect(sanitizeHeaders({ 'Content-Type': 'application/json' })).toEqual({
      'Content-Type': 'application/json',
    })
  })

  it('handles mixed sensitive and safe headers', () => {
    const result = sanitizeHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    })
    expect(result['Content-Type']).toBe('application/json')
    expect(result['Authorization']).toBe('[redacted]')
  })
})

describe('sanitizeObject', () => {
  it('redacts password field', () => {
    expect(sanitizeObject({ password: 'secret123', name: 'Alice' })).toEqual({
      password: '[redacted]',
      name: 'Alice',
    })
  })

  it('redacts token field', () => {
    expect(sanitizeObject({ token: 'abc123' })).toEqual({ token: '[redacted]' })
  })

  it('redacts secret field', () => {
    expect(sanitizeObject({ secret: 'my-secret' })).toEqual({ secret: '[redacted]' })
  })

  it('redacts key field', () => {
    expect(sanitizeObject({ key: 'api-key-value' })).toEqual({ key: '[redacted]' })
  })

  it('is case-insensitive for sensitive keys', () => {
    expect(sanitizeObject({ PASSWORD: 'hunter2' })).toEqual({ PASSWORD: '[redacted]' })
  })

  it('passes through clean objects unchanged', () => {
    expect(sanitizeObject({ name: 'Alice', age: 30 })).toEqual({ name: 'Alice', age: 30 })
  })
})
