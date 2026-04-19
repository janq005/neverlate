'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Category } from '@/lib/types'
import { addDeadline, getSettings } from '@/lib/storage'
import { calculateStartDate } from '@/lib/scheduler'

const categories: { value: Category; label: string }[] = [
  { value: 'university', label: 'University' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'personal', label: 'Personal' },
  { value: 'projects', label: 'Projects' },
]

export default function AddPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('university')
  const [dueDate, setDueDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState(4)
  const [hoursPerDay, setHoursPerDay] = useState(1.5)
  const [startBy, setStartBy] = useState('')
  const [daysNeeded, setDaysNeeded] = useState(0)

  useEffect(() => {
    const settings = getSettings()
    setHoursPerDay(settings.defaultHoursPerDay)
  }, [])

  useEffect(() => {
    if (dueDate && estimatedHours > 0 && hoursPerDay > 0) {
      const sb = calculateStartDate(dueDate, estimatedHours, hoursPerDay)
      setStartBy(sb)
      setDaysNeeded(Math.ceil(estimatedHours / hoursPerDay))
    } else {
      setStartBy('')
    }
  }, [dueDate, estimatedHours, hoursPerDay])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return

    addDeadline({ title, description, category, dueDate, estimatedHours, hoursPerDay })
    router.push('/')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Add Deadline</h1>
        <p className="text-zinc-400 text-sm mt-1">Plan your work before it plans you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Database Assignment"
            required
            className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  category === c.value
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Due Date *</label>
          <input
            type="date"
            value={dueDate}
            min={today}
            onChange={e => setDueDate(e.target.value)}
            required
            className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800/60 px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors [color-scheme:dark]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Estimated Hours</label>
            <span className="text-sm font-semibold text-indigo-400">{estimatedHours}h</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={100}
            step={0.5}
            value={estimatedHours}
            onChange={e => setEstimatedHours(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-zinc-600">
            <span>0.5h</span><span>100h</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Hours / Day Willing</label>
            <span className="text-sm font-semibold text-indigo-400">{hoursPerDay}h</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={12}
            step={0.5}
            value={hoursPerDay}
            onChange={e => setHoursPerDay(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-zinc-600">
            <span>0.5h</span><span>12h</span>
          </div>
        </div>

        {/* Preview */}
        {startBy && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-1.5">Plan Preview</p>
            <p className="text-sm text-zinc-200">
              Start by{' '}
              <span className="font-semibold text-indigo-300">
                {new Date(startBy).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
              {' '}— work{' '}
              <span className="font-semibold text-indigo-300">{hoursPerDay}h/day</span>
              {' '}for{' '}
              <span className="font-semibold text-indigo-300">{daysNeeded} days</span>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!title.trim() || !dueDate}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3.5 text-sm transition-colors mt-2"
        >
          Add Deadline
        </button>
      </form>
    </div>
  )
}
