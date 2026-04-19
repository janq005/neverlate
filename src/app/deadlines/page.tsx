'use client'

import { useEffect, useState } from 'react'
import { getDeadlines } from '@/lib/storage'
import { Deadline, Category, Status } from '@/lib/types'
import { getUrgency, daysUntil } from '@/lib/scheduler'
import { Urgency } from '@/lib/types'
import DeadlineCard from '@/components/DeadlineCard'

type SortKey = 'dueDate' | 'urgency' | 'createdAt'

const urgencyOrder: Record<Urgency, number> = { red: 0, orange: 1, yellow: 2, green: 3 }

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<Status | 'active' | 'all'>('active')
  const [sortBy, setSortBy] = useState<SortKey>('urgency')
  const [showDone, setShowDone] = useState(false)

  const load = () => setDeadlines(getDeadlines())

  useEffect(() => { load() }, [])

  const handleUpdate = () => load()
  const handleDelete = () => load()

  const active = deadlines.filter(d => d.status !== 'completed')
  const done = deadlines.filter(d => d.status === 'completed')

  const filtered = active
    .filter(d => filterCategory === 'all' || d.category === filterCategory)
    .filter(d => {
      if (filterStatus === 'all' || filterStatus === 'active') return true
      return d.status === filterStatus
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (sortBy === 'urgency') return urgencyOrder[getUrgency(a)] - urgencyOrder[getUrgency(b)]
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const categories: (Category | 'all')[] = ['all', 'university', 'clinic', 'personal', 'projects']

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">All Deadlines</h1>
        <p className="text-zinc-400 text-sm mt-1">{active.length} active · {done.length} completed</p>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize ${
                filterCategory === c
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1.5">
            {(['urgency', 'dueDate', 'createdAt'] as SortKey[]).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  sortBy === s
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {s === 'dueDate' ? 'Due Date' : s === 'createdAt' ? 'Recent' : 'Urgency'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-8 text-center">
          <p className="text-zinc-500 text-sm">No deadlines match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <DeadlineCard key={d.id} deadline={d} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Done section */}
      {done.length > 0 && (
        <section>
          <button
            onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3"
          >
            <span>{showDone ? '▼' : '▶'}</span>
            Done ({done.length})
          </button>
          {showDone && (
            <div className="space-y-3">
              {done.map(d => (
                <DeadlineCard key={d.id} deadline={d} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
