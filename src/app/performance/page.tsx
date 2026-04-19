'use client'

import { useEffect, useState } from 'react'
import { PerformanceRecord } from '@/lib/types'
import { getPerformanceRecords, getAverageRating, getPersonalBest, getTotalHoursSaved } from '@/lib/performance'

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 8 ? 'text-emerald-400' : rating >= 6 ? 'text-indigo-400' : rating >= 4 ? 'text-yellow-400' : 'text-orange-400'
  return <span className={`text-lg font-bold ${color}`}>{rating.toFixed(1)}</span>
}

export default function PerformancePage() {
  const [records, setRecords] = useState<PerformanceRecord[]>([])
  const [avg, setAvg] = useState<number | null>(null)
  const [best, setBest] = useState<PerformanceRecord | null>(null)
  const [totalSaved, setTotalSaved] = useState(0)

  useEffect(() => {
    const r = getPerformanceRecords().sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    setRecords(r)
    setAvg(getAverageRating())
    setBest(getPersonalBest())
    setTotalSaved(getTotalHoursSaved())
  }, [])

  const trendData = [...records].reverse().slice(-10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Performance</h1>
        <p className="text-zinc-400 text-sm mt-1">How well you execute — not just what you complete.</p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-8 text-center space-y-2">
          <p className="text-2xl">📈</p>
          <p className="text-zinc-400 text-sm">Complete your first deadline to see performance data.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 text-center">
              <div className="text-3xl font-bold text-indigo-400">{avg?.toFixed(1) ?? '—'}</div>
              <div className="text-xs text-zinc-500 mt-1">Average Rating</div>
              <div className="text-xs text-zinc-400">out of 10</div>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 text-center">
              <div className={`text-3xl font-bold ${totalSaved >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {totalSaved >= 0 ? '+' : ''}{totalSaved}h
              </div>
              <div className="text-xs text-zinc-500 mt-1">Total Hours</div>
              <div className="text-xs text-zinc-400">{totalSaved >= 0 ? 'saved' : 'over estimate'}</div>
            </div>
          </div>

          {/* Personal best */}
          {best && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">🏆 Personal Best</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{best.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {best.speedRatio.toFixed(2)}x speed · {best.estimatedHours}h est → {best.actualHours}h actual
                  </p>
                </div>
                <div className="text-2xl font-bold text-amber-400">{best.performanceRating.toFixed(1)}</div>
              </div>
            </div>
          )}

          {/* Trend chart (mini) */}
          {trendData.length >= 2 && (
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Trend (last {trendData.length})</p>
              <div className="flex items-end gap-1.5 h-12">
                {trendData.map((r, i) => {
                  const h = Math.max(8, (r.performanceRating / 10) * 48)
                  const color = r.performanceRating >= 8 ? 'bg-emerald-400' : r.performanceRating >= 6 ? 'bg-indigo-400' : r.performanceRating >= 4 ? 'bg-yellow-400' : 'bg-orange-400'
                  return (
                    <div
                      key={i}
                      title={`${r.title}: ${r.performanceRating.toFixed(1)}/10`}
                      className={`flex-1 rounded-sm ${color} opacity-80`}
                      style={{ height: `${h}px` }}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>oldest</span>
                <span>latest</span>
              </div>
            </div>
          )}

          {/* Records list */}
          <section>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              All Completed ({records.length})
            </h2>
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.deadlineId} className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate">{r.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {r.estimatedHours}h est → {r.actualHours}h actual ·{' '}
                        <span className={r.speedRatio >= 1 ? 'text-emerald-400' : 'text-orange-400'}>
                          {r.speedRatio.toFixed(2)}x speed
                        </span>
                        {r.daysEarly > 0 && <span className="text-emerald-400"> · {r.daysEarly}d early</span>}
                        {r.daysEarly < 0 && <span className="text-red-400"> · {Math.abs(r.daysEarly)}d late</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <RatingBadge rating={r.performanceRating} />
                      <div className="text-[10px] text-zinc-600">/10</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
