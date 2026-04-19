'use client'

import { useState } from 'react'
import { Deadline } from '@/lib/types'
import { getUrgency, daysUntil, getUrgencyLabel } from '@/lib/scheduler'
import { deleteDeadline, updateDeadline } from '@/lib/storage'
import { updateTodayLog, getProductivityLogs, getTodayStr } from '@/lib/productivity'
import { calculatePerformanceRating, getPerformanceMessage, savePerformanceRecord } from '@/lib/performance'
import UrgencyDot from './UrgencyDot'
import CategoryBadge from './CategoryBadge'
import TimeLogger from './TimeLogger'

const urgencyBorder: Record<string, string> = {
  green: 'border-emerald-500/20',
  yellow: 'border-yellow-500/30',
  orange: 'border-orange-500/30',
  red: 'border-red-500/40',
}

const urgencyBg: Record<string, string> = {
  green: 'bg-emerald-500/5',
  yellow: 'bg-yellow-500/5',
  orange: 'bg-orange-500/5',
  red: 'bg-red-500/5',
}

interface Props {
  deadline: Deadline
  onUpdate?: (d: Deadline) => void
  onDelete?: (id: string) => void
}

export default function DeadlineCard({ deadline, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showConfidence, setShowConfidence] = useState(false)
  const [celebration, setCelebration] = useState<{ message: string; rating: number; speedRatio: number; hoursSaved: number } | null>(null)
  const urgency = getUrgency(deadline)
  const daysLeft = daysUntil(deadline.dueDate)
  const progress = deadline.estimatedHours > 0 ? (deadline.hoursLogged / deadline.estimatedHours) * 100 : 0

  const handleComplete = () => {
    setShowConfidence(true)
  }

  const handleConfidenceSelect = (confidenceRating: number) => {
    const completedDeadline = { ...deadline, completedAt: new Date().toISOString() }
    const { rating, speedRatio, hoursSaved } = calculatePerformanceRating(completedDeadline)
    const updated = updateDeadline(deadline.id, {
      status: 'completed',
      completedAt: completedDeadline.completedAt,
      confidence: confidenceRating,
      performanceRating: rating,
      speedRatio,
    })
    if (updated) savePerformanceRecord(updated)
    // Update productivity log
    const logs = getProductivityLogs()
    const today = getTodayStr()
    const todayLog = logs.find(l => l.date === today)
    updateTodayLog({
      tasksCompleted: (todayLog?.tasksCompleted ?? 0) + 1,
      hoursLogged: (todayLog?.hoursLogged ?? 0) + deadline.hoursLogged,
    })
    setShowConfidence(false)
    setCelebration({ message: getPerformanceMessage(rating, speedRatio, hoursSaved), rating, speedRatio, hoursSaved })
    if (updated && onUpdate) onUpdate(updated)
  }

  const handleDelete = () => {
    if (!confirm(`Delete "${deadline.title}"?`)) return
    deleteDeadline(deadline.id)
    if (onDelete) onDelete(deadline.id)
  }

  const handleTimeUpdate = (updated: Deadline) => {
    if (onUpdate) onUpdate(updated)
  }

  return (
    <div
      className={`rounded-xl border ${urgencyBorder[urgency]} ${urgencyBg[urgency]} bg-zinc-900/60 backdrop-blur-sm overflow-hidden transition-all`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-1">
              <UrgencyDot urgency={urgency} />
            </div>
            <div className="min-w-0">
              <p className={`font-medium text-sm truncate ${deadline.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                {deadline.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <CategoryBadge category={deadline.category} size="sm" />
                <span className="text-xs text-zinc-400">
                  {daysLeft < 0
                    ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0
                    ? 'Due today'
                    : `${daysLeft}d left`}
                </span>
              </div>
            </div>
          </div>
          <div className="text-zinc-500 text-xs shrink-0">{expanded ? '▲' : '▼'}</div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
            <span>{deadline.hoursLogged}h / {deadline.estimatedHours}h</span>
            <span className={progress >= 100 ? 'text-emerald-400' : ''}>{Math.round(Math.min(progress, 100))}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${urgency === 'red' ? 'bg-red-500' : urgency === 'orange' ? 'bg-orange-400' : urgency === 'yellow' ? 'bg-yellow-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {deadline.status !== 'completed' && (
            <p className={`text-[11px] mt-1.5 ${urgency === 'red' ? 'text-red-400' : urgency === 'orange' ? 'text-orange-400' : urgency === 'yellow' ? 'text-yellow-400' : 'text-zinc-500'}`}>
              {getUrgencyLabel(deadline)}
            </p>
          )}
          {deadline.confidence && (
            <p className="text-[11px] mt-1 text-zinc-500">Confidence: {'★'.repeat(deadline.confidence)}{'☆'.repeat(5 - deadline.confidence)}</p>
          )}
        </div>
      </button>

      {/* Confidence rating modal */}
      {showConfidence && (
        <div className="px-4 pb-4 border-t border-zinc-800/60 pt-3">
          <p className="text-sm font-medium text-zinc-200 mb-1">How confident did you feel?</p>
          <p className="text-xs text-zinc-500 mb-3">Rate your execution — be honest.</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(r => (
              <button
                key={r}
                onClick={() => handleConfidenceSelect(r)}
                className="flex-1 rounded-lg border border-zinc-700/60 bg-zinc-800/40 py-2.5 text-sm font-bold text-zinc-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleConfidenceSelect(3)}
            className="mt-2 w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
          >
            skip (neutral)
          </button>
        </div>
      )}

      {/* Celebration screen */}
      {celebration && (
        <div className="px-4 pb-4 border-t border-emerald-500/20 pt-3 bg-emerald-500/5 space-y-3">
          <p className="text-sm text-zinc-100 font-medium">{celebration.message}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-900/60 rounded-lg p-2">
              <div className="text-lg font-bold text-indigo-400">{celebration.rating.toFixed(1)}</div>
              <div className="text-[10px] text-zinc-500">/ 10</div>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-2">
              <div className={`text-lg font-bold ${celebration.speedRatio >= 1 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {celebration.speedRatio.toFixed(2)}x
              </div>
              <div className="text-[10px] text-zinc-500">speed</div>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-2">
              <div className={`text-lg font-bold ${celebration.hoursSaved >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {celebration.hoursSaved >= 0 ? '+' : ''}{celebration.hoursSaved.toFixed(1)}h
              </div>
              <div className="text-[10px] text-zinc-500">saved</div>
            </div>
          </div>
          <button
            onClick={() => setCelebration(null)}
            className="w-full rounded-lg bg-indigo-500/20 border border-indigo-500/30 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
          >
            Keep going →
          </button>
        </div>
      )}

      {expanded && !showConfidence && !celebration && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/60 pt-3">
          {deadline.description && (
            <p className="text-sm text-zinc-400">{deadline.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <div>
              <span className="text-zinc-500">Due:</span>{' '}
              <span className="text-zinc-300">{new Date(deadline.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-zinc-500">Start by:</span>{' '}
              <span className="text-zinc-300">{new Date(deadline.startBy).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-zinc-500">Pace:</span>{' '}
              <span className="text-zinc-300">{deadline.hoursPerDay}h/day</span>
            </div>
            <div>
              <span className="text-zinc-500">Status:</span>{' '}
              <span className="text-zinc-300 capitalize">{deadline.status.replace('_', ' ')}</span>
            </div>
          </div>

          {deadline.status !== 'completed' && (
            <TimeLogger deadline={deadline} onUpdate={handleTimeUpdate} />
          )}

          <div className="flex gap-2 pt-1">
            {deadline.status !== 'completed' && (
              <button
                onClick={handleComplete}
                className="flex-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                Mark Complete
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
