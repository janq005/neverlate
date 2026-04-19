const POMODORO_LOG_KEY = 'neverlate_pomodoro_log'

export interface PomodoroSession {
  id: string
  deadlineId?: string
  deadlineTitle?: string
  startedAt: string
  completedAt: string
  durationMinutes: number
  type: 'work' | 'break'
}

export function getPomodoroSessions(): PomodoroSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(POMODORO_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: PomodoroSession[]): void {
  if (typeof window === 'undefined') return
  // Keep last 200 sessions
  localStorage.setItem(POMODORO_LOG_KEY, JSON.stringify(sessions.slice(-200)))
}

export function logPomodoroSession(session: Omit<PomodoroSession, 'id'>): PomodoroSession {
  const sessions = getPomodoroSessions()
  const full: PomodoroSession = { ...session, id: crypto.randomUUID() }
  sessions.push(full)
  saveSessions(sessions)
  return full
}

export function getTodaySessions(): PomodoroSession[] {
  const today = new Date().toISOString().split('T')[0]
  return getPomodoroSessions().filter(s => s.completedAt.startsWith(today) && s.type === 'work')
}

export function playBeep(): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    // Web Audio not available
  }
}
