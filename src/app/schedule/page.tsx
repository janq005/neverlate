'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSettings } from '@/lib/storage'

interface CalEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

interface DayGroup {
  date: string
  label: string
  events: CalEvent[]
  freeHours: number
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseTime(dt: string | undefined): Date | null {
  if (!dt) return null
  return new Date(dt)
}

function toHHMM(dt: Date): string {
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function calcFreeHours(events: CalEvent[], dayStart = 8, dayEnd = 22): number {
  const timedEvents = events
    .map(e => ({
      start: parseTime(e.start.dateTime),
      end: parseTime(e.end.dateTime),
    }))
    .filter((e): e is { start: Date; end: Date } => e.start !== null && e.end !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const workStart = dayStart * 60
  const workEnd = dayEnd * 60
  let busyMinutes = 0

  for (const ev of timedEvents) {
    const evStartMin = ev.start.getHours() * 60 + ev.start.getMinutes()
    const evEndMin = ev.end.getHours() * 60 + ev.end.getMinutes()
    const overlapStart = Math.max(evStartMin, workStart)
    const overlapEnd = Math.min(evEndMin, workEnd)
    if (overlapEnd > overlapStart) busyMinutes += overlapEnd - overlapStart
  }

  return Math.max(0, Math.round(((workEnd - workStart - busyMinutes) / 60) * 10) / 10)
}

function groupByDay(events: CalEvent[], weekStart: Date): DayGroup[] {
  const groups: DayGroup[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayEvents = events.filter(e => {
      const dt = e.start.dateTime ?? e.start.date ?? ''
      return dt.startsWith(dateStr)
    })
    const dow = DAY_NAMES[d.getDay()]
    const label = `${dow} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
    groups.push({ date: dateStr, label, events: dayEvents, freeHours: calcFreeHours(dayEvents) })
  }
  return groups
}

export default function SchedulePage() {
  const [apiKey, setApiKey] = useState('')
  const [calId, setCalId] = useState('')
  const [days, setDays] = useState<DayGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    const s = getSettings()
    const key = s.googleCalendarApiKey ?? ''
    const id = s.googleCalendarId ?? ''
    setApiKey(key)
    setCalId(id)
    setConfigured(!!(key && id))
  }, [])

  const getWeekStart = useCallback(() => {
    const now = new Date()
    // Monday-based week
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - dow + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    return monday
  }, [weekOffset])

  const fetchEvents = useCallback(async (key: string, id: string) => {
    setLoading(true)
    setError('')
    try {
      const weekStart = getWeekStart()
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)

      const encodedId = encodeURIComponent(id)
      const params = new URLSearchParams({
        key,
        timeMin: weekStart.toISOString(),
        timeMax: weekEnd.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      })
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?${params}`
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      const groups = groupByDay(data.items ?? [], weekStart)
      setDays(groups)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch calendar')
      setDays([])
    } finally {
      setLoading(false)
    }
  }, [getWeekStart])

  useEffect(() => {
    if (apiKey && calId) fetchEvents(apiKey, calId)
  }, [apiKey, calId, weekOffset, fetchEvents])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayGroup = days.find(d => d.date === todayStr)

  if (!configured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Schedule</h1>
          <p className="text-zinc-400 text-sm mt-1">Google Calendar integration</p>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-5 space-y-4">
          <p className="text-sm text-zinc-300">
            Connect your Google Calendar to see your week and calculate free study hours.
          </p>
          <div className="space-y-2 text-xs text-zinc-500 list-inside">
            <p>1. Go to <span className="text-indigo-400">console.cloud.google.com</span> → create a project</p>
            <p>2. Enable <strong className="text-zinc-300">Google Calendar API</strong></p>
            <p>3. Create an <strong className="text-zinc-300">API key</strong> under Credentials</p>
            <p>4. In Google Calendar, share your calendar publicly or note its Calendar ID</p>
          </div>
          <a
            href="/settings"
            className="block w-full text-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 text-sm transition-colors"
          >
            Go to Settings to enter API key
          </a>
        </div>
      </div>
    )
  }

  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekLabel = `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Schedule</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {todayGroup
            ? `You have ${todayGroup.freeHours}h free today for assignment work`
            : 'Your Google Calendar this week'}
        </p>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-zinc-300">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ›
        </button>
      </div>

      {weekOffset !== 0 && (
        <button
          onClick={() => setWeekOffset(0)}
          className="w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Back to current week
        </button>
      )}

      {loading && (
        <div className="text-center text-zinc-500 text-sm py-8">Loading calendar…</div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300 font-medium">Error: {error}</p>
          <p className="text-xs text-red-400/70 mt-1">
            Make sure your API key is valid and your calendar is accessible. Public calendars or calendars shared with the API key work best.
          </p>
          <a href="/settings" className="text-xs text-indigo-400 hover:underline mt-2 block">
            Update API key in Settings →
          </a>
        </div>
      )}

      {!loading && !error && days.length > 0 && (
        <div className="space-y-3">
          {days.map(group => {
            const isToday = group.date === todayStr
            return (
              <div
                key={group.date}
                className={`rounded-xl border p-4 space-y-2 ${
                  isToday
                    ? 'border-indigo-500/40 bg-indigo-500/5'
                    : 'border-zinc-800/60 bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${isToday ? 'text-indigo-300' : 'text-zinc-300'}`}>
                    {group.label} {isToday && <span className="text-xs text-indigo-400 font-normal">(today)</span>}
                  </h3>
                  <span className={`text-xs font-semibold ${
                    group.freeHours >= 3 ? 'text-emerald-400' :
                    group.freeHours >= 1 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {group.freeHours}h free
                  </span>
                </div>

                {group.events.length === 0 ? (
                  <p className="text-xs text-zinc-600">No events — full day available</p>
                ) : (
                  <div className="space-y-1">
                    {group.events.map(ev => {
                      const start = parseTime(ev.start.dateTime)
                      const end = parseTime(ev.end.dateTime)
                      const allDay = !ev.start.dateTime
                      return (
                        <div key={ev.id} className="flex gap-2 items-baseline">
                          <span className="text-xs text-zinc-500 w-24 flex-shrink-0 tabular-nums">
                            {allDay ? 'All day' : `${start ? toHHMM(start) : '?'}–${end ? toHHMM(end) : '?'}`}
                          </span>
                          <span className="text-xs text-zinc-300 truncate">{ev.summary ?? '(No title)'}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-1">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Weekly Free Time</h2>
        {days.map(group => (
          <div key={group.date} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-28 flex-shrink-0">{group.label}</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${
                  group.freeHours >= 3 ? 'bg-emerald-500' :
                  group.freeHours >= 1 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((group.freeHours / 14) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 w-8 text-right">{group.freeHours}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}
