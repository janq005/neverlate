'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSettings } from '@/lib/storage'
import { getDeadlines, logTime } from '@/lib/storage'
import { logPomodoroSession, getTodaySessions, playBeep } from '@/lib/pomodoro'
import { Deadline } from '@/lib/types'

const CIRCUMFERENCE = 2 * Math.PI * 54 // radius = 54

type Phase = 'work' | 'break'

export default function TimerPage() {
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [phase, setPhase] = useState<Phase>('work')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [linkedId, setLinkedId] = useState<string>('')
  const [todayCount, setTodayCount] = useState(0)

  const startedAtRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSeconds = phase === 'work' ? workMinutes * 60 : breakMinutes * 60

  useEffect(() => {
    const s = getSettings()
    const wm = s.pomodoroWorkMinutes ?? 25
    const bm = s.pomodoroBreakMinutes ?? 5
    setWorkMinutes(wm)
    setBreakMinutes(bm)
    setSecondsLeft(wm * 60)
    setDeadlines(getDeadlines().filter(d => d.status !== 'completed'))
    setTodayCount(getTodaySessions().length)
  }, [])

  const handleComplete = useCallback(() => {
    playBeep()
    const linked = deadlines.find(d => d.id === linkedId)
    const session = logPomodoroSession({
      deadlineId: linked?.id,
      deadlineTitle: linked?.title,
      startedAt: startedAtRef.current ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMinutes: phase === 'work' ? workMinutes : breakMinutes,
      type: phase,
    })
    if (phase === 'work' && linked) {
      logTime(linked.id, workMinutes / 60)
      setDeadlines(getDeadlines().filter(d => d.status !== 'completed'))
    }
    if (phase === 'work') {
      setTodayCount(getTodaySessions().length)
      setPhase('break')
      setSecondsLeft(breakMinutes * 60)
    } else {
      setPhase('work')
      setSecondsLeft(workMinutes * 60)
    }
    setRunning(false)
    startedAtRef.current = null
    void session
  }, [phase, workMinutes, breakMinutes, linkedId, deadlines])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, handleComplete])

  // Space bar shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        toggleTimer()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const toggleTimer = () => {
    if (!running) {
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString()
      setRunning(true)
    } else {
      setRunning(false)
    }
  }

  const reset = () => {
    setRunning(false)
    startedAtRef.current = null
    setSecondsLeft(phase === 'work' ? workMinutes * 60 : breakMinutes * 60)
  }

  const progress = secondsLeft / totalSeconds
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const secs = (secondsLeft % 60).toString().padStart(2, '0')
  const linked = deadlines.find(d => d.id === linkedId)

  const ringColor = phase === 'work'
    ? running ? '#6366f1' : '#4f46e5'
    : running ? '#10b981' : '#059669'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Pomodoro</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {todayCount} session{todayCount !== 1 ? 's' : ''} completed today · Space to start/pause
        </p>
      </div>

      {/* Phase indicator */}
      <div className="flex gap-2">
        <button
          onClick={() => { if (!running) { setPhase('work'); setSecondsLeft(workMinutes * 60) } }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            phase === 'work' ? 'bg-indigo-600 text-white' : 'bg-zinc-800/60 text-zinc-400'
          }`}
        >
          Work {workMinutes}m
        </button>
        <button
          onClick={() => { if (!running) { setPhase('break'); setSecondsLeft(breakMinutes * 60) } }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            phase === 'break' ? 'bg-emerald-600 text-white' : 'bg-zinc-800/60 text-zinc-400'
          }`}
        >
          Break {breakMinutes}m
        </button>
      </div>

      {/* Circular timer */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#27272a" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-zinc-100 tabular-nums">{mins}:{secs}</span>
            <span className={`text-xs font-semibold mt-0.5 ${phase === 'work' ? 'text-indigo-400' : 'text-emerald-400'}`}>
              {phase === 'work' ? 'FOCUS' : 'BREAK'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={toggleTimer}
            className={`w-28 rounded-xl py-3 text-sm font-bold transition-colors ${
              running
                ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                : phase === 'work'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="w-20 rounded-xl border border-zinc-700/60 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Linked deadline */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Working On</h2>
        {linked ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-100">{linked.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {(linked.estimatedHours - linked.hoursLogged).toFixed(1)}h remaining
              </p>
            </div>
            <button
              onClick={() => setLinkedId('')}
              className="text-zinc-500 hover:text-red-400 text-xs transition-colors"
            >
              Unlink
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No deadline linked — time won&apos;t be auto-logged</p>
        )}

        {deadlines.length > 0 && (
          <select
            value={linkedId}
            onChange={e => setLinkedId(e.target.value)}
            className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 transition-colors"
          >
            <option value="">— Link a deadline —</option>
            {deadlines.map(d => (
              <option key={d.id} value={d.id}>
                {d.title} ({(d.estimatedHours - d.hoursLogged).toFixed(1)}h left)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Session counter */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Today&apos;s Sessions</h2>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: Math.max(todayCount, 4) }).map((_, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                i < todayCount
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800/60 text-zinc-600'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {(todayCount * workMinutes / 60).toFixed(1)} hours focused today
        </p>
      </div>
    </div>
  )
}
