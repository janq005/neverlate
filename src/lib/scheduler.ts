import { Deadline, Urgency } from './types'

export function calculateStartDate(dueDate: string, estimatedHours: number, hoursPerDay: number): string {
  const due = new Date(dueDate)
  const safePace = Math.max(hoursPerDay, 0.1)
  const daysNeeded = Math.ceil(estimatedHours / safePace)
  const start = new Date(due)
  start.setDate(start.getDate() - daysNeeded)
  return start.toISOString().split('T')[0]
}

export function getUrgency(deadline: Deadline): Urgency {
  if (deadline.status === 'completed') return 'green'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startBy = new Date(deadline.startBy)
  startBy.setHours(0, 0, 0, 0)

  const due = new Date(deadline.dueDate)
  due.setHours(0, 0, 0, 0)

  const daysUntilStart = Math.floor((startBy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const hoursRemaining = deadline.estimatedHours - deadline.hoursLogged

  // Red: mathematically impossible at current pace
  if (daysUntilDue < 0) return 'red'
  if (daysUntilDue === 0 && hoursRemaining > 0) return 'red'
  if (daysUntilDue > 0 && hoursRemaining / daysUntilDue > 16) return 'red'

  // Orange: behind schedule but catchable if you increase pace
  if (daysUntilStart < 0) return 'orange'

  // Yellow: should start soon (1-3 days until startBy)
  if (daysUntilStart >= 0 && daysUntilStart <= 3) return 'yellow'

  // Green: plenty of time
  return 'green'
}

export interface DailyTask {
  deadline: Deadline
  urgency: Urgency
  hoursToday: number
}

export function getDailyPlan(deadlines: Deadline[]): DailyTask[] {
  const active = deadlines.filter(d => d.status !== 'completed')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const urgencyOrder: Record<Urgency, number> = { red: 0, orange: 1, yellow: 2, green: 3 }

  const tasks: DailyTask[] = active
    .filter(d => {
      const startBy = new Date(d.startBy)
      startBy.setHours(0, 0, 0, 0)
      return startBy <= today
    })
    .map(d => ({
      deadline: d,
      urgency: getUrgency(d),
      hoursToday: d.hoursPerDay,
    }))
    .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

  return tasks
}

export function getUpcoming(deadlines: Deadline[], days = 7): Deadline[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today)
  limit.setDate(limit.getDate() + days)

  return deadlines
    .filter(d => {
      if (d.status === 'completed') return false
      const due = new Date(d.dueDate)
      return due >= today && due <= limit
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getNotificationText(deadline: Deadline): string {
  const urgency = getUrgency(deadline)
  const daysToStart = daysUntil(deadline.startBy)
  const daysToDue = daysUntil(deadline.dueDate)
  const hoursRemaining = deadline.estimatedHours - deadline.hoursLogged

  switch (urgency) {
    case 'green':
      return `${deadline.title} — start by ${formatDate(deadline.startBy)} (${daysToStart} days from now)`
    case 'yellow':
      return daysToStart === 0
        ? `⚠️ Start ${deadline.title} today. On-time delivery is non-negotiable.`
        : `⚠️ Start ${deadline.title} tomorrow. Winners don't wait.`
    case 'orange': {
      const pace = hoursRemaining > 0 && daysToDue > 0 ? Math.ceil(hoursRemaining / daysToDue) : 0
      return `🔥 You're leaving ${hoursRemaining}h on the table on ${deadline.title}. Push to ${pace}h/day — you can close this gap.`
    }
    case 'red':
      return `🚨 ${deadline.title} — ${hoursRemaining}h in ${daysToDue} days. This is your moment to outperform.`
  }
}

export function getUrgencyLabel(deadline: Deadline): string {
  const urgency = getUrgency(deadline)
  const daysToDue = daysUntil(deadline.dueDate)
  const hoursRemaining = deadline.estimatedHours - deadline.hoursLogged
  const daysToStart = daysUntil(deadline.startBy)

  switch (urgency) {
    case 'green':
      return `On track — ${daysToStart}d to start`
    case 'yellow':
      return daysToStart === 0
        ? `Start today. Delayed = falling behind.`
        : `Start in ${daysToStart}d. Don't let this slip.`
    case 'orange':
      return `You're leaving ${hoursRemaining}h on the table. Increase your pace.`
    case 'red':
      return `${hoursRemaining}h needed in ${daysToDue}d. This is your test.`
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export function getWeeklyStats(deadlines: Deadline[]) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)

  const completedThisWeek = deadlines.filter(d => {
    if (!d.completedAt) return false
    return new Date(d.completedAt) >= weekStart
  }).length

  const active = deadlines.filter(d => d.status !== 'completed')
  const onTrack = active.filter(d => {
    const u = getUrgency(d)
    return u === 'green' || u === 'yellow'
  }).length

  const onTrackPct = active.length > 0 ? Math.round((onTrack / active.length) * 100) : 100

  return { active: active.length, completedThisWeek, onTrackPct }
}
