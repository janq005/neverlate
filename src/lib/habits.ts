const HABITS_KEY = 'neverlate_habits'
const HABIT_LOGS_KEY = 'neverlate_habit_logs'

export interface Habit {
  id: string
  name: string
  createdAt: string
}

// date YYYY-MM-DD -> array of completed habit IDs
export type HabitLogs = Record<string, string[]>

export const MORNING_PRESET = ['Wake up early', 'Exercise', 'Cold shower', 'Read 20 min']
export const EVENING_PRESET = ['Review today', 'Plan tomorrow', 'No screens 30 min', 'Stretch']

export function getHabits(): Habit[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HABITS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHabits(habits: Habit[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits))
}

export function addHabit(name: string): Habit {
  const habits = getHabits()
  const habit: Habit = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() }
  habits.push(habit)
  saveHabits(habits)
  return habit
}

export function removeHabit(id: string): void {
  saveHabits(getHabits().filter(h => h.id !== id))
}

export function getHabitLogs(): HabitLogs {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(HABIT_LOGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveHabitLogs(logs: HabitLogs): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(logs))
}

export function toggleHabitDay(habitId: string, date: string): boolean {
  const logs = getHabitLogs()
  const day = logs[date] ?? []
  const done = day.includes(habitId)
  logs[date] = done ? day.filter(id => id !== habitId) : [...day, habitId]
  saveHabitLogs(logs)
  return !done
}

export function isHabitDone(habitId: string, date: string): boolean {
  const logs = getHabitLogs()
  return (logs[date] ?? []).includes(habitId)
}

export function getHabitStreak(habitId: string): number {
  const logs = getHabitLogs()
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if ((logs[dateStr] ?? []).includes(habitId)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export function getMonthlyCompletion(habitId: string): number {
  const logs = getHabitLogs()
  let done = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if ((logs[dateStr] ?? []).includes(habitId)) done++
  }
  return Math.round((done / 30) * 100)
}

export function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}
