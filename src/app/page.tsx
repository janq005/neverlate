'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDeadlines, getSettings } from '@/lib/storage'
import { getDailyPlan, getUpcoming, getWeeklyStats, daysUntil, DailyTask } from '@/lib/scheduler'
import { Deadline } from '@/lib/types'
import UrgencyDot from '@/components/UrgencyDot'
import CategoryBadge from '@/components/CategoryBadge'
import TimeLogger from '@/components/TimeLogger'
import { requestNotificationPermission, scheduleDailyMorningNotification } from '@/lib/notifications'
import { getDailyQuote } from '@/lib/quotes'
import { EnergyLevel, getEnergyToday, setEnergyToday, getStreak, updateTodayLog } from '@/lib/productivity'
import { getAverageRating } from '@/lib/performance'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const energyLabels: Record<EnergyLevel, string> = {
  1: '🔥',
  2: '🔥🔥',
  3: '🔥🔥🔥',
}

const energyText: Record<EnergyLevel, string> = {
  1: 'Low — steady pace',
  2: 'Solid — push through',
  3: 'On fire — attack the hardest tasks',
}

export default function DashboardPage() {
  const [plan, setPlan] = useState<DailyTask[]>([])
  const [upcoming, setUpcoming] = useState<Deadline[]>([])
  const [stats, setStats] = useState({ active: 0, completedThisWeek: 0, onTrackPct: 100 })
  const [name, setName] = useState('Titas')
  const [quote] = useState(getDailyQuote())
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [streak, setStreak] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)

  const load = () => {
    const deadlines = getDeadlines()
    const settings = getSettings()
    setName(settings.name)
    let sorted = getDailyPlan(deadlines)
    const currentEnergy = getEnergyToday()
    // High energy: hardest tasks first (already sorted by urgency)
    // Low energy: soften order, put shorter tasks up
    if (currentEnergy === 1) {
      sorted = [...sorted].sort((a, b) => a.deadline.estimatedHours - b.deadline.estimatedHours)
    }
    setPlan(sorted)
    setUpcoming(getUpcoming(deadlines, 7))
    setStats(getWeeklyStats(deadlines))
    setEnergy(getEnergyToday())
    setStreak(getStreak())
    setAvgRating(getAverageRating())
  }

  useEffect(() => {
    load()
    requestNotificationPermission().then(granted => {
      if (granted) scheduleDailyMorningNotification(getDeadlines())
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTaskUpdate = (_updated: Deadline) => {
    load()
  }

  const handleEnergySelect = (level: EnergyLevel) => {
    setEnergyToday(level)
    updateTodayLog({ energyLevel: level })
    setEnergy(level)
    load()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          {greeting()}, {name} 👋
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Daily quote */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1.5">Today&apos;s Mindset</p>
        <p className="text-sm text-zinc-200 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-3 text-center">
          <div className="text-lg font-bold text-indigo-400">{stats.active}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Active</div>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{stats.completedThisWeek}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Done/wk</div>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{streak}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">🔥 Streak</div>
        </div>
        <Link href="/performance" className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 p-3 text-center hover:border-indigo-500/30 transition-colors">
          <div className="text-lg font-bold text-purple-400">{avgRating != null ? avgRating.toFixed(1) : '—'}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Avg/10</div>
        </Link>
      </div>

      {/* Energy check-in */}
      <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Motion — What&apos;s your energy?
        </p>
        {energy ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg">{energyLabels[energy]}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{energyText[energy]}</p>
            </div>
            <button
              onClick={() => { setEnergyToday(1 as EnergyLevel); setEnergy(null) }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              reset
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            {([1, 2, 3] as EnergyLevel[]).map(level => (
              <button
                key={level}
                onClick={() => handleEnergySelect(level)}
                className="flex-1 rounded-xl border border-zinc-700/60 bg-zinc-800/40 py-3 text-center hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-colors"
              >
                <div className="text-xl">{energyLabels[level]}</div>
                <div className="text-[10px] text-zinc-500 mt-1">{level === 1 ? 'Low' : level === 2 ? 'Solid' : 'On fire'}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Today's Plan */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Today&apos;s Plan
        </h2>
        {plan.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-6 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-zinc-400 text-sm">Nothing urgent today — you&apos;re ahead of schedule!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plan.map(({ deadline, urgency, hoursToday }) => (
              <div key={deadline.id} className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <UrgencyDot urgency={urgency} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-100 truncate">{deadline.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={deadline.category} size="sm" />
                      <span className="text-xs text-zinc-400">{hoursToday}h today</span>
                    </div>
                  </div>
                </div>
                <TimeLogger deadline={deadline} onUpdate={handleTaskUpdate} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Upcoming (7 days)
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-zinc-500 text-sm">No deadlines in the next 7 days.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(d => {
              const days = daysUntil(d.dueDate)
              return (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-900/40 px-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CategoryBadge category={d.category} size="sm" />
                    <span className="text-sm text-zinc-200 truncate">{d.title}</span>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0 ml-2">
                    {days === 0 ? 'Today' : `${days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
