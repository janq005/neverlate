import { Deadline, Settings } from './types'
import { calculateStartDate } from './scheduler'

const DEADLINES_KEY = 'neverlate_deadlines'
const SETTINGS_KEY = 'neverlate_settings'

export function getDeadlines(): Deadline[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEADLINES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
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

export function getSettings(): Settings {
  if (typeof window === 'undefined') return { name: 'Titas', defaultHoursPerDay: 1.5, notificationsEnabled: true }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { name: 'Titas', defaultHoursPerDay: 1.5, notificationsEnabled: true }
  } catch {
    return { name: 'Titas', defaultHoursPerDay: 1.5, notificationsEnabled: true }
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
  const data = JSON.parse(json)
  if (data.deadlines) saveDeadlines(data.deadlines)
  if (data.settings) saveSettings(data.settings)
}
