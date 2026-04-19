import { Urgency } from '@/lib/types'

const colors: Record<Urgency, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-400',
  red: 'bg-red-500',
}

const pulseColors: Record<Urgency, string> = {
  green: '',
  yellow: 'animate-pulse',
  orange: 'animate-pulse',
  red: 'animate-ping',
}

interface Props {
  urgency: Urgency
  size?: 'sm' | 'md'
}

export default function UrgencyDot({ urgency, size = 'md' }: Props) {
  const dim = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
  return (
    <span className="relative inline-flex">
      {urgency === 'red' && (
        <span className={`absolute inline-flex ${dim} rounded-full ${colors[urgency]} opacity-75 animate-ping`} />
      )}
      <span className={`relative inline-flex rounded-full ${dim} ${colors[urgency]}`} />
    </span>
  )
}
