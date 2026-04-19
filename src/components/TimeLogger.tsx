'use client'

import { logTime } from '@/lib/storage'
import { Deadline } from '@/lib/types'

interface Props {
  deadline: Deadline
  onUpdate: (updated: Deadline) => void
}

const increments = [0.5, 1, 2]

export default function TimeLogger({ deadline, onUpdate }: Props) {
  const handleLog = (hours: number) => {
    const updated = logTime(deadline.id, hours)
    if (updated) onUpdate(updated)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400">Log:</span>
      {increments.map(h => (
        <button
          key={h}
          onClick={() => handleLog(h)}
          className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
        >
          +{h}h
        </button>
      ))}
    </div>
  )
}
