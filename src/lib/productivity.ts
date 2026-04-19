export type EnergyLevel = 1 | 2 | 3

export interface DayLog {
  date: string // YYYY-MM-DD
  hoursLogged: number
  tasksCompleted: number
  deadlinesHit: number
  energyLevel?: EnergyLevel
}

const ENERGY_KEY = 'neverlate_energy'
const PRODUCTIVITY_KEY = 'neverlate_productivity'

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function getEnergyToday(): EnergyLevel | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ENERGY_KEY)
    const log: { date: string; level: EnergyLevel } = raw ? JSON.parse(raw) : null
    if (log && log.date === getTodayStr()) return log.level
    return null
  } catch {
    return null
  }
}

export function setEnergyToday(level: EnergyLevel): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ENERGY_KEY, JSON.stringify({ date: getTodayStr(), level }))
}

export function clearEnergyToday(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ENERGY_KEY)
}

export function getProductivityLogs(): DayLog[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PRODUCTIVITY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function updateTodayLog(updates: Partial<DayLog>): void {
  if (typeof window === 'undefined') return
  const logs = getProductivityLogs()
  const today = getTodayStr()
  const idx = logs.findIndex(l => l.date === today)
  const base: DayLog = { date: today, hoursLogged: 0, tasksCompleted: 0, deadlinesHit: 0 }
  if (idx === -1) {
    logs.push({ ...base, ...updates })
  } else {
    logs[idx] = { ...logs[idx], ...updates }
  }
  localStorage.setItem(PRODUCTIVITY_KEY, JSON.stringify(logs.slice(-90)))
}

export function getDailyScore(log: DayLog): number {
  const hoursScore = Math.min(log.hoursLogged * 10, 50)
  const completedScore = log.tasksCompleted * 20
  const hitScore = log.deadlinesHit * 30
  return Math.min(Math.round(hoursScore + completedScore + hitScore), 100)
}

export function getStreak(): number {
  const logs = getProductivityLogs()
  if (logs.length === 0) return 0

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const log = logs.find(l => l.date === dateStr)
    if (log && getDailyScore(log) > 0) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

export function getConfidenceTrend(): number[] {
  const logs = getProductivityLogs().slice(-7)
  return logs.map(l => l.energyLevel || 0)
}
