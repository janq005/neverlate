'use client'

import { useEffect, useState } from 'react'
import { getDeadlines } from '@/lib/storage'
import { Deadline } from '@/lib/types'
import { getUrgency } from '@/lib/scheduler'
import UrgencyDot from '@/components/UrgencyDot'
import CategoryBadge from '@/components/CategoryBadge'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => { setDeadlines(getDeadlines()) }, [])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  const getDeadlinesForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dueThat = deadlines.filter(d => d.dueDate === dateStr && d.status !== 'completed')
    const startThat = deadlines.filter(d => d.startBy === dateStr && d.status !== 'completed' && d.dueDate !== dateStr)
    return { due: dueThat, start: startThat }
  }

  const selectedDeadlines = selectedDay ? getDeadlinesForDay(selectedDay) : null

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Calendar</h1>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold text-zinc-200">
          {monthNames[viewMonth]} {viewYear}
        </h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-[11px] text-zinc-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const { due, start } = getDeadlinesForDay(day)
          const hasDue = due.length > 0
          const hasStart = start.length > 0
          const selected = selectedDay === day

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(selected ? null : day)}
              className={`relative rounded-lg aspect-square flex flex-col items-center justify-center text-xs font-medium transition-colors
                ${isToday(day) ? 'ring-1 ring-indigo-500' : ''}
                ${selected ? 'bg-indigo-500/20 border-indigo-500/40 border' : 'bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-800/60'}
                ${isToday(day) ? 'text-indigo-300' : 'text-zinc-300'}
              `}
            >
              <span>{day}</span>
              {(hasDue || hasStart) && (
                <div className="flex gap-0.5 mt-0.5">
                  {due.map((d, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${getUrgencyColor(getUrgency(d))}`} />
                  ))}
                  {hasStart && !hasDue && (
                    <span className="w-1 h-1 rounded-full bg-zinc-500" />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day details */}
      {selectedDay && selectedDeadlines && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">
            {monthNames[viewMonth]} {selectedDay}
          </h3>

          {selectedDeadlines.due.length === 0 && selectedDeadlines.start.length === 0 && (
            <p className="text-sm text-zinc-500">No deadlines or planned starts.</p>
          )}

          {selectedDeadlines.due.length > 0 && (
            <div>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-2">Due</p>
              <div className="space-y-2">
                {selectedDeadlines.due.map(d => (
                  <div key={d.id} className="flex items-center gap-2">
                    <UrgencyDot urgency={getUrgency(d)} size="sm" />
                    <span className="text-sm text-zinc-200">{d.title}</span>
                    <CategoryBadge category={d.category} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDeadlines.start.length > 0 && (
            <div>
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-2">Start By</p>
              <div className="space-y-2">
                {selectedDeadlines.start.map(d => (
                  <div key={d.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                    <span className="text-sm text-zinc-400">{d.title}</span>
                    <CategoryBadge category={d.category} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />On track</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />Start soon</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />Behind</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Critical</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500" />Start by</span>
      </div>
    </div>
  )
}

function getUrgencyColor(urgency: string) {
  if (urgency === 'green') return 'bg-emerald-400'
  if (urgency === 'yellow') return 'bg-yellow-400'
  if (urgency === 'orange') return 'bg-orange-400'
  return 'bg-red-500'
}
