'use client'

import { useEffect, useState } from 'react'
import {
  Habit, addHabit, getHabits, removeHabit,
  toggleHabitDay, isHabitDone, getHabitStreak,
  getMonthlyCompletion, getLast7Days, MORNING_PRESET, EVENING_PRESET,
} from '@/lib/habits'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<Record<string, boolean>>({})
  const [newName, setNewName] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [, forceUpdate] = useState(0)

  const today = new Date().toISOString().split('T')[0]
  const last7 = getLast7Days()

  useEffect(() => {
    const h = getHabits()
    setHabits(h)
    const initial: Record<string, boolean> = {}
    h.forEach(habit => { initial[habit.id] = isHabitDone(habit.id, today) })
    setLogs(initial)
  }, [today])

  const handleToggle = (habitId: string) => {
    const newState = toggleHabitDay(habitId, today)
    setLogs(prev => ({ ...prev, [habitId]: newState }))
  }

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const h = addHabit(trimmed)
    setHabits(prev => [...prev, h])
    setLogs(prev => ({ ...prev, [h.id]: false }))
    setNewName('')
  }

  const handlePreset = (names: string[]) => {
    const existing = getHabits().map(h => h.name.toLowerCase())
    const added: Habit[] = []
    names.forEach(name => {
      if (!existing.includes(name.toLowerCase())) {
        added.push(addHabit(name))
      }
    })
    setHabits(getHabits())
    const newLogs: Record<string, boolean> = {}
    added.forEach(h => { newLogs[h.id] = false })
    setLogs(prev => ({ ...prev, ...newLogs }))
    setShowPresets(false)
  }

  const handleRemove = (id: string) => {
    removeHabit(id)
    setHabits(prev => prev.filter(h => h.id !== id))
    forceUpdate(n => n + 1)
  }

  const doneToday = habits.filter(h => logs[h.id]).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Habits</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {doneToday}/{habits.length} done today
        </p>
      </div>

      {/* Today's checklist */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-2">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Today</h2>
        {habits.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-4">No habits yet. Add some below.</p>
        )}
        {habits.map(habit => {
          const done = !!logs[habit.id]
          const streak = getHabitStreak(habit.id)
          const monthly = getMonthlyCompletion(habit.id)
          return (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(habit.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-zinc-600 bg-transparent'
                  }`}
                >
                  {done && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm font-medium ${done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                  {habit.name}
                </span>
                <span className="text-xs text-zinc-500">{monthly}%</span>
                {streak > 1 && (
                  <span className="text-xs text-amber-400 font-semibold">{streak}🔥</span>
                )}
                <button
                  onClick={() => handleRemove(habit.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-1"
                >
                  ✕
                </button>
              </div>

              {/* 7-day streak circles */}
              <div className="flex gap-1.5 pl-9">
                {last7.map(date => {
                  const isDone = isHabitDone(habit.id, date)
                  const isToday = date === today
                  return (
                    <div key={date} className="flex flex-col items-center gap-0.5">
                      <div className={`w-5 h-5 rounded-full border transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500'
                          : isToday
                          ? 'border-zinc-500 bg-transparent'
                          : 'border-zinc-700 bg-transparent'
                      }`} />
                      <span className="text-[9px] text-zinc-600">{dateLabel(date)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add habit */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Add Habit</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Meditate 10 min"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold px-4 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Presets */}
        <button
          onClick={() => setShowPresets(s => !s)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {showPresets ? 'Hide presets' : '+ Load preset routines'}
        </button>

        {showPresets && (
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handlePreset(MORNING_PRESET)}
              className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/20 transition-colors text-left px-3"
            >
              ☀️ Morning Routine — {MORNING_PRESET.join(', ')}
            </button>
            <button
              onClick={() => handlePreset(EVENING_PRESET)}
              className="w-full rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors text-left px-3"
            >
              🌙 Evening Routine — {EVENING_PRESET.join(', ')}
            </button>
          </div>
        )}
      </div>

      {/* Monthly stats */}
      {habits.length > 0 && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">30-Day Completion</h2>
          {habits.map(habit => {
            const monthly = getMonthlyCompletion(habit.id)
            return (
              <div key={habit.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">{habit.name}</span>
                  <span className="text-zinc-400 font-semibold">{monthly}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${monthly}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
