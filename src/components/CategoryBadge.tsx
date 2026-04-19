import { Category } from '@/lib/types'

const styles: Record<Category, string> = {
  university: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  clinic: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  personal: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  projects: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const labels: Record<Category, string> = {
  university: 'University',
  clinic: 'Clinic',
  personal: 'Personal',
  projects: 'Projects',
}

interface Props {
  category: Category
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'md' }: Props) {
  const textSize = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${textSize} ${styles[category]}`}>
      {labels[category]}
    </span>
  )
}
