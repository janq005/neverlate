'use client'

import { useEffect, useState } from 'react'
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editFields, setEditFields] = useState({
    title: deadline.title,
    dueDate: deadline.dueDate,
    estimatedHours: deadline.estimatedHours,
    hoursPerDay: deadline.hoursPerDay,
  })

  const urgency = getUrgency(deadline)
  const daysLeft = daysUntil(deadline.dueDate)
  const progress = deadline.estimatedHours > 0 ? (deadline.hoursLogged / deadline.estimatedHours) * 100 : 0

  useEffect(() => {
    if (!expanded) setConfirmDelete(false)
  }, [expanded])

  const applyCompletion = (d: Deadline, confidenceRating?: number) => {
    const isAlreadyCompleted = d.status === 'completed'
    const completedAt = isAlreadyCompleted ? (d.completedAt || new Date().toISOString()) : new Date().toISOString()
    const completedDeadline = { ...d, completedAt }
    const { rating, speedRatio, hoursSaved } = calculatePerformanceRating(completedDeadline)

    const updates: Partial<Deadline> = { performanceRating: rating, speedRatio }
    if (!isAlreadyCompleted) {
      updates.status = 'completed'
      updates.completedAt = completedAt
    }
    if (confidenceRating !== undefined) updates.confidence = confidenceRating

    const updated = updateDeadline(d.id, updates)
    if (updated) savePerformanceRecord(updated)
    return { updated, rating, speedRatio, hoursSaved }
  }

  const updateLog = (d: Deadline) => {
    const logs = getProductivityLogs()
    const today = getTodayStr()
    const todayLog = logs.find(l => l.date === today)
    updateTodayLog({
      tasksCompleted: (todayLog?.tasksCompleted ?? 0) + 1,
      hoursLogged: (todayLog?.hoursLogged ?? 0) + d.hoursLogged,
    })
  }

  const handleComplete = () => {
    setShowConfidence(true)
  }

  const handleConfidenceSelect = (confidenceRating: number) => {
    const wasCompleted = deadline.status === 'completed'
    const { updated, rating, speedRatio, hoursSaved } = applyCompletion(deadline, confidenceRating)
    if (!wasCompleted) updateLog(deadline)
    setShowConfidence(false)
    setCelebration({ message: getPerformanceMessage(rating, speedRatio, hoursSaved), rating, speedRatio, hoursSaved })
    if (updated && onUpdate) onUpdate(updated)
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteDeadline(deadline.id)
    if (onDelete) onDelete(deadline.id)
  }

  const handleTimeUpdate = (updated: Deadline) => {
    if (updated.status === 'completed' && deadline.status !== 'completed') {
      updateLog(updated)
      setShowConfidence(true)
    }
    if (onUpdate) onUpdate(updated)
  }

  const handleEditOpen = () => {
    setEditFields({
      title: deadline.title,
      dueDate: deadline.dueDate,
      estimatedHours: deadline.estimatedHours,
      hoursPerDay: deadline.hoursPerDay,
    })
    setEditing(true)
  }

  const handleEditSave = () => {
    if (!editFields.title.trim()) return
    const updated = updateDeadline(deadline.id, editFields)
    if (updated && onUpdate) onUpdate(updated)
    setEditing(false)
  }

  const today = new Date().toISOString().split('T')[0]

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

      {/* Confidence rating */}
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

      {/* Edit form */}
      {editing && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/60 pt-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Edit</p>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Title</label>
            <input
              type="text"
              value={editFields.title}
              onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Due Date</label>
            <input
              type="date"
              value={editFields.dueDate}
              min={today}
              onChange={e => setEditFields(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 transition-colors [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs text-zinc-500">Estimated Hours</label>
              <span className="text-xs text-indigo-400">{editFields.estimatedHours}h</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={100}
              step={0.5}
              value={editFields.estimatedHours}
              onChange={e => setEditFields(f => ({ ...f, estimatedHours: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs text-zinc-500">Hours / Day</label>
              <span className="text-xs text-indigo-400">{editFields.hoursPerDay}h</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={editFields.hoursPerDay}
              onChange={e => setEditFields(f => ({ ...f, hoursPerDay: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEditSave}
              disabled={!editFields.title.trim()}
              className="flex-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-40 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg bg-zinc-800/40 border border-zinc-700/60 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-700/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {expanded && !showConfidence && !celebration && !editing && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/60 pt-3">
          {deadline.description && (
            <p className="text-sm text-zinc-400">{deadline.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <div>
              <span className="text-zinc-500">Due:</span>{' '}
              <span className="text-zinc-300">{new Date(deadline.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-zinc-500">Start by:</span>{' '}
              <span className="text-zinc-300">{new Date(deadline.startBy + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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

          <div className="space-y-2 pt-1">
            {deadline.status !== 'completed' && (
              <div className="flex gap-2">
                <button
                  onClick={handleComplete}
                  className="flex-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  Mark Complete
                </button>
                <button
                  onClick={handleEditOpen}
                  className="flex-1 rounded-lg bg-zinc-800/40 border border-zinc-700/60 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700/40 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-lg bg-red-500/20 border border-red-500/40 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-lg bg-zinc-800/40 border border-zinc-700/60 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700/40 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="w-full rounded-lg bg-red-500/10 border border-red-500/20 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
