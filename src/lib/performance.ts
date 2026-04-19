import { Deadline, PerformanceRecord } from './types'

const PERF_KEY = 'neverlate_performance'

export function calculatePerformanceRating(deadline: Deadline): {
  rating: number
  speedRatio: number
  daysEarly: number
  hoursSaved: number
} {
  const actualHours = deadline.hoursLogged || deadline.estimatedHours
  const speedRatio = deadline.estimatedHours / Math.max(actualHours, 0.1)

  const dueDate = new Date(deadline.dueDate)
  dueDate.setHours(0, 0, 0, 0)
  const completedAt = deadline.completedAt ? new Date(deadline.completedAt) : new Date()
  completedAt.setHours(0, 0, 0, 0)
  const daysEarly = Math.floor((dueDate.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24))

  const createdAt = new Date(deadline.createdAt)
  const totalDays = Math.max(
    Math.ceil((dueDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    1
  )

  const timeScore = daysEarly > 0 ? Math.min(daysEarly / totalDays, 1) : 0
  const rawRating = speedRatio * 7 + timeScore * 3
  const rating = Math.min(10, Math.max(1, Math.round(rawRating * 10) / 10))
  const hoursSaved = deadline.estimatedHours - actualHours

  return { rating, speedRatio, daysEarly, hoursSaved }
}

export function getPerformanceMessage(rating: number, speedRatio: number, hoursSaved: number): string {
  const saved = Math.abs(hoursSaved).toFixed(1)
  if (rating >= 9) return `⚡ ${rating.toFixed(1)}/10 — Elite. ${saved}h faster than estimated. You don't just meet the bar — you move it.`
  if (rating >= 7.5) return `🔥 ${rating.toFixed(1)}/10 — You crushed it. ${saved}h faster than planned.`
  if (rating >= 6) return `✅ ${rating.toFixed(1)}/10 — Solid execution. Room to push harder.`
  if (rating >= 4) return `📊 ${rating.toFixed(1)}/10 — Done. Consistency compounds — keep showing up.`
  if (speedRatio < 0.8) return `⚠️ ${rating.toFixed(1)}/10 — Took ${saved}h longer than expected. Adjust your estimates.`
  return `🎯 ${rating.toFixed(1)}/10 — Finished. Own the clock next time.`
}

export function savePerformanceRecord(deadline: Deadline): PerformanceRecord {
  const { rating, speedRatio, daysEarly } = calculatePerformanceRating(deadline)
  const record: PerformanceRecord = {
    deadlineId: deadline.id,
    title: deadline.title,
    category: deadline.category,
    estimatedHours: deadline.estimatedHours,
    actualHours: deadline.hoursLogged,
    speedRatio,
    performanceRating: rating,
    daysEarly,
    completedAt: deadline.completedAt || new Date().toISOString(),
  }

  const records = getPerformanceRecords()
  const existing = records.findIndex(r => r.deadlineId === deadline.id)
  if (existing >= 0) {
    records[existing] = record
  } else {
    records.push(record)
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERF_KEY, JSON.stringify(records))
  }
  return record
}

export function getPerformanceRecords(): PerformanceRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PERF_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getAverageRating(): number | null {
  const records = getPerformanceRecords()
  if (records.length === 0) return null
  return Math.round((records.reduce((sum, r) => sum + r.performanceRating, 0) / records.length) * 10) / 10
}

export function getPersonalBest(): PerformanceRecord | null {
  const records = getPerformanceRecords()
  if (records.length === 0) return null
  return records.reduce((best, r) => r.performanceRating > best.performanceRating ? r : best)
}

export function getTotalHoursSaved(): number {
  const records = getPerformanceRecords()
  return Math.round(records.reduce((sum, r) => sum + (r.estimatedHours - r.actualHours), 0) * 10) / 10
}
