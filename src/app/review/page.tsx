'use client'

import { useEffect, useState } from 'react'
import { getDeadlines } from '@/lib/storage'
import { getPerformanceRecords } from '@/lib/performance'
import { getProductivityLogs, getDailyScore } from '@/lib/productivity'

const REVIEW_KEY = 'neverlate_weekly_reviews'

interface WeeklyReview {
  weekStart: string // YYYY-MM-DD (Monday)
  wentWell: string
  toImprove: string
  savedAt: string
  // computed stats (stored for history comparison)
  completed: number
  hoursWorked: number
  avgRating: number
  deadlinesHit: number
  deadlinesMissed: number
  score: number
}

function getMonday(date: Date): string {
  const d = new Date(date)
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - dow)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00')
  const end = new Date(weekStart + 'T12:00:00')
  end.setDate(end.getDate() + 6)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`
}

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function computeWeekStats(weekStart: string) {
  const dates = getWeekDates(weekStart)
  const weekEnd = dates[6]

  const deadlines = getDeadlines()
  const perfRecords = getPerformanceRecords()
  const productivityLogs = getProductivityLogs()

  const completed = deadlines.filter(d => {
    if (!d.completedAt) return false
    const comp = d.completedAt.split('T')[0]
    return comp >= weekStart && comp <= weekEnd
  }).length

  const hoursWorked = dates.reduce((sum, date) => {
    const log = productivityLogs.find(l => l.date === date)
    return sum + (log?.hoursLogged ?? 0)
  }, 0)

  const weekPerf = perfRecords.filter(r => {
    const comp = r.completedAt.split('T')[0]
    return comp >= weekStart && comp <= weekEnd
  })
  const avgRating = weekPerf.length > 0
    ? Math.round((weekPerf.reduce((s, r) => s + r.performanceRating, 0) / weekPerf.length) * 10) / 10
    : 0

  const deadlinesHit = weekPerf.filter(r => r.daysEarly >= 0).length
  const deadlinesMissed = weekPerf.filter(r => r.daysEarly < 0).length

  const dayLogs = productivityLogs.filter(l => dates.includes(l.date))
  const avgDailyScore = dayLogs.length > 0
    ? dayLogs.reduce((s, l) => s + getDailyScore(l), 0) / dayLogs.length
    : 0

  const completionRate = (completed + deadlinesMissed) > 0
    ? (completed / (completed + deadlinesMissed)) * 100 : 100
  const consistencyBonus = dayLogs.filter(l => getDailyScore(l) > 30).length / 7 * 100
  const score = Math.round(
    completionRate * 0.4 +
    Math.min((avgRating / 10) * 100, 100) * 0.35 +
    consistencyBonus * 0.25
  )

  return { completed, hoursWorked: Math.round(hoursWorked * 10) / 10, avgRating, deadlinesHit, deadlinesMissed, score, avgDailyScore }
}

function getReviews(): WeeklyReview[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REVIEW_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveReviews(reviews: WeeklyReview[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews))
}

function ScoreBadge({ score, prev }: { score: number; prev?: number }) {
  let arrow = ''
  let arrowColor = 'text-zinc-500'
  if (prev !== undefined) {
    if (score > prev + 2) { arrow = '↑'; arrowColor = 'text-emerald-400' }
    else if (score < prev - 2) { arrow = '↓'; arrowColor = 'text-red-400' }
    else { arrow = '→'; arrowColor = 'text-amber-400' }
  }
  const color = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
  return (
    <span className={`text-3xl font-bold ${color}`}>
      {score}
      <span className="text-base font-normal text-zinc-500">/100</span>
      {arrow && <span className={`text-xl ml-1 ${arrowColor}`}>{arrow}</span>}
    </span>
  )
}

export default function ReviewPage() {
  const thisWeek = getMonday(new Date())
  const [wentWell, setWentWell] = useState('')
  const [toImprove, setToImprove] = useState('')
  const [saved, setSaved] = useState(false)
  const [reviews, setReviews] = useState<WeeklyReview[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [stats, setStats] = useState({ completed: 0, hoursWorked: 0, avgRating: 0, deadlinesHit: 0, deadlinesMissed: 0, score: 0, avgDailyScore: 0 })

  useEffect(() => {
    const all = getReviews()
    setReviews(all)
    const existing = all.find(r => r.weekStart === thisWeek)
    if (existing) {
      setWentWell(existing.wentWell)
      setToImprove(existing.toImprove)
    }
    setStats(computeWeekStats(thisWeek))
  }, [thisWeek])

  const lastWeek = (() => {
    const d = new Date(thisWeek + 'T12:00:00')
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })()
  const lastWeekReview = reviews.find(r => r.weekStart === lastWeek)
  const lastWeekStats = lastWeekReview ?? (lastWeek ? computeWeekStats(lastWeek) : null)

  const handleSave = () => {
    const all = getReviews().filter(r => r.weekStart !== thisWeek)
    const entry: WeeklyReview = {
      weekStart: thisWeek,
      wentWell,
      toImprove,
      savedAt: new Date().toISOString(),
      ...stats,
    }
    all.push(entry)
    all.sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    saveReviews(all)
    setReviews(all)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const pastReviews = reviews.filter(r => r.weekStart !== thisWeek)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Weekly Review</h1>
        <p className="text-zinc-400 text-sm mt-1">{formatWeekLabel(thisWeek)}</p>
      </div>

      {/* This week's stats */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Weekly Score</h2>
            <div className="mt-1">
              <ScoreBadge score={stats.score} prev={lastWeekStats?.score} />
            </div>
          </div>
          {lastWeekStats && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Last week</p>
              <p className="text-lg font-bold text-zinc-400">{lastWeekStats.score}<span className="text-xs text-zinc-600">/100</span></p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-zinc-800/60 p-3">
            <p className="text-xs text-zinc-500">Tasks completed</p>
            <p className="text-xl font-bold text-zinc-100">{stats.completed}</p>
            {lastWeekStats && (
              <p className="text-xs text-zinc-600 mt-0.5">
                {stats.completed > lastWeekStats.completed ? '↑' : stats.completed < lastWeekStats.completed ? '↓' : '→'} last week: {lastWeekStats.completed}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-zinc-800/60 p-3">
            <p className="text-xs text-zinc-500">Hours worked</p>
            <p className="text-xl font-bold text-zinc-100">{stats.hoursWorked}h</p>
            {lastWeekStats && (
              <p className="text-xs text-zinc-600 mt-0.5">
                {stats.hoursWorked > lastWeekStats.hoursWorked ? '↑' : stats.hoursWorked < lastWeekStats.hoursWorked ? '↓' : '→'} last week: {lastWeekStats.hoursWorked}h
              </p>
            )}
          </div>
          <div className="rounded-lg bg-zinc-800/60 p-3">
            <p className="text-xs text-zinc-500">Avg performance</p>
            <p className="text-xl font-bold text-zinc-100">{stats.avgRating > 0 ? `${stats.avgRating}/10` : '—'}</p>
            {lastWeekStats && lastWeekStats.avgRating > 0 && (
              <p className="text-xs text-zinc-600 mt-0.5">last week: {lastWeekStats.avgRating}/10</p>
            )}
          </div>
          <div className="rounded-lg bg-zinc-800/60 p-3">
            <p className="text-xs text-zinc-500">Deadlines hit / missed</p>
            <p className="text-xl font-bold">
              <span className="text-emerald-400">{stats.deadlinesHit}</span>
              <span className="text-zinc-600"> / </span>
              <span className="text-red-400">{stats.deadlinesMissed}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-4">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reflection</h2>
        <div className="space-y-1.5">
          <label className="text-sm text-zinc-300 font-medium">What went well?</label>
          <textarea
            rows={3}
            value={wentWell}
            onChange={e => setWentWell(e.target.value)}
            placeholder="Finished the lab report early, stayed consistent with pomodoros…"
            className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 transition-colors resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-zinc-300 font-medium">What to improve?</label>
          <textarea
            rows={3}
            value={toImprove}
            onChange={e => setToImprove(e.target.value)}
            placeholder="Started the essay too late, phone distractions during study…"
            className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 transition-colors resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 text-sm transition-colors"
        >
          {saved ? '✓ Review saved!' : 'Save Review'}
        </button>
      </div>

      {/* History */}
      {pastReviews.length > 0 && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-2">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Past Reviews</h2>
          {pastReviews.map((review, i) => (
            <div key={review.weekStart} className="border-t border-zinc-800/60 pt-2">
              <button
                onClick={() => setExpanded(expanded === review.weekStart ? null : review.weekStart)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">{formatWeekLabel(review.weekStart)}</p>
                  <p className="text-xs text-zinc-500">Score: {review.score}/100 · {review.completed} completed</p>
                </div>
                <div className="flex items-center gap-2">
                  {i < pastReviews.length - 1 && (
                    <span className={`text-xs font-semibold ${
                      review.score > pastReviews[i + 1].score ? 'text-emerald-400' :
                      review.score < pastReviews[i + 1].score ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {review.score > pastReviews[i + 1].score ? '↑' : review.score < pastReviews[i + 1].score ? '↓' : '→'}
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-zinc-500 transition-transform ${expanded === review.weekStart ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {expanded === review.weekStart && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-zinc-800/40 p-2">
                      <p className="text-zinc-500">Hours worked</p>
                      <p className="font-semibold text-zinc-200">{review.hoursWorked}h</p>
                    </div>
                    <div className="rounded-lg bg-zinc-800/40 p-2">
                      <p className="text-zinc-500">Avg rating</p>
                      <p className="font-semibold text-zinc-200">{review.avgRating > 0 ? `${review.avgRating}/10` : '—'}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-800/40 p-2">
                      <p className="text-zinc-500">Hit / Missed</p>
                      <p className="font-semibold"><span className="text-emerald-400">{review.deadlinesHit}</span> / <span className="text-red-400">{review.deadlinesMissed}</span></p>
                    </div>
                  </div>
                  {review.wentWell && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">What went well</p>
                      <p className="text-sm text-zinc-300 bg-zinc-800/40 rounded-lg p-2">{review.wentWell}</p>
                    </div>
                  )}
                  {review.toImprove && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">To improve</p>
                      <p className="text-sm text-zinc-300 bg-zinc-800/40 rounded-lg p-2">{review.toImprove}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
