let counter = 0

export function generateId(): string {
  return `act-${++counter}`
}
