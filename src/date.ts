export function getAfterDate(days: number, now = new Date()): string {
  const date = new Date(now)
  date.setDate(date.getDate() - days)

  return date.toISOString().slice(0, 10)
}
