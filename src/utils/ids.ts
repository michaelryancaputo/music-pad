export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Math.random().toString(36).slice(2, 10)}`
