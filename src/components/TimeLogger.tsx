'use client'

import { useState } from 'react'
import { logTime } from '@/lib/storage'
import { Deadline } from '@/lib/types'

interface Props {
  deadline: Deadline
  onUpdate: (updated: Deadline) => void
}

const increments = [0.5, 1, 2]

export default function TimeLogger({ deadline, onUpdate }: Props) {
  const [custom, setCustom] = useState('')

  const handleLog = (hours: number) => {
    const updated = logTime(deadline.id, hours)
    if (updated) onUpdate(updated)
  }

  const handleCustom = () => {
    const h = parseFloat(custom)
    if (!isNaN(h) && h > 0) {
      handleLog(h)
      setCustom('')
    }
  }

  return (
    <div className="space-y-2">
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
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustom()}
            placeholder="0"
            className="w-14 rounded-md bg-zinc-800/60 border border-zinc-700/60 px-2 py-1 text-xs text-zinc-200 text-center placeholder-zinc-600 focus:outline-none focus:border-indigo-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={handleCustom}
            disabled={!custom || isNaN(parseFloat(custom)) || parseFloat(custom) <= 0}
            className="rounded-md bg-zinc-700/60 border border-zinc-600/40 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 transition-colors"
          >
            +h
          </button>
        </div>
      </div>
    </div>
  )
}
