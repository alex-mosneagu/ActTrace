const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'key'])
const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie'])

export function isSensitiveHeader(name: string): boolean {
  return SENSITIVE_HEADERS.has(name.toLowerCase())
}

export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    result[key] = isSensitiveHeader(key) ? '[redacted]' : value
  }
  return result
}

export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[redacted]' : value
  }
  return result
}
