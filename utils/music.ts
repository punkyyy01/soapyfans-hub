export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export function getTotalDuration(tracks: { duration_ms: number | null }[]): string | null {
  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0)
  if (totalMs <= 0) return null
  const totalMinutes = Math.round(totalMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
