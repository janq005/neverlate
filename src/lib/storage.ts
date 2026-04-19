import { Deadline, Settings } from './types'
import { calculateStartDate } from './scheduler'

const DEADLINES_KEY = 'neverlate_deadlines'
const SETTINGS_KEY = 'neverlate_settings'

export function getDeadlines(): Deadline[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEADLINES_KEY)
    const deadlines: Deadline[] = raw ? JSON.parse(raw) : []
    return syncOverdueStatuses(deadlines)
  } catch {
    return []
  }
}

function syncOverdueStatuses(deadlines: Deadline[]): Deadline[] {
  const today = new Date().toISOString().split('T')[0]
  let changed = false
  const synced = deadlines.map(d => {
    if (d.status !== 'completed' && d.status !== 'overdue' && d.dueDate < today) {
      changed = true
      return { ...d, status: 'overdue' as const }
    }
    return d
  })
  if (changed) localStorage.setItem(DEADLINES_KEY, JSON.stringify(synced))
  return synced
}

export function saveDeadlines(deadlines: Deadline[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEADLINES_KEY, JSON.stringify(deadlines))
}

export function addDeadline(deadline: Omit<Deadline, 'id' | 'createdAt' | 'startBy' | 'hoursLogged' | 'status'>): Deadline {
  const deadlines = getDeadlines()
  const startBy = calculateStartDate(deadline.dueDate, deadline.estimatedHours, deadline.hoursPerDay)
  const newDeadline: Deadline = {
    ...deadline,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    startBy,
    hoursLogged: 0,
    status: 'not_started',
  }
  deadlines.push(newDeadline)
  saveDeadlines(deadlines)
  return newDeadline
}

export function updateDeadline(id: string, updates: Partial<Deadline>): Deadline | null {
  const deadlines = getDeadlines()
  const idx = deadlines.findIndex(d => d.id === id)
  if (idx === -1) return null

  const updated = { ...deadlines[idx], ...updates }
  if (updates.dueDate || updates.estimatedHours || updates.hoursPerDay) {
    updated.startBy = calculateStartDate(
      updated.dueDate,
      updated.estimatedHours,
      updated.hoursPerDay
    )
  }
  deadlines[idx] = updated
  saveDeadlines(deadlines)
  return updated
}

export function deleteDeadline(id: string): void {
  const deadlines = getDeadlines().filter(d => d.id !== id)
  saveDeadlines(deadlines)
}

export function logTime(id: string, hours: number): Deadline | null {
  const deadlines = getDeadlines()
  const idx = deadlines.findIndex(d => d.id === id)
  if (idx === -1) return null

  deadlines[idx].hoursLogged = Math.round((deadlines[idx].hoursLogged + hours) * 100) / 100
  if (deadlines[idx].status === 'not_started') {
    deadlines[idx].status = 'in_progress'
  }
  saveDeadlines(deadlines)
  return deadlines[idx]
}

const DEFAULT_SETTINGS: Settings = { name: '', defaultHoursPerDay: 1.5, notificationsEnabled: true }

export function getSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function exportData(): string {
  return JSON.stringify({ deadlines: getDeadlines(), settings: getSettings() }, null, 2)
}

export function importData(json: string): void {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON')
  }
  if (!data || typeof data !== 'object') throw new Error('Invalid data format')
  const d = data as Record<string, unknown>
  if (d.deadlines !== undefined) {
    if (!Array.isArray(d.deadlines)) throw new Error('deadlines must be an array')
    saveDeadlines(d.deadlines as Deadline[])
  }
  if (d.settings !== undefined) {
    if (typeof d.settings !== 'object' || d.settings === null) throw new Error('settings must be an object')
    saveSettings(d.settings as Settings)
  }
}
