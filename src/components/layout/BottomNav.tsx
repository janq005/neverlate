'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Today', icon: SunIcon },
  { href: '/add', label: 'Add', icon: PlusIcon },
  { href: '/deadlines', label: 'All', icon: ListIcon },
  { href: '/calendar', label: 'Cal', icon: CalIcon },
  { href: '/performance', label: 'Stats', icon: ChartIcon },
]

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function CalIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
    </svg>
  )
}

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/60 pb-safe">
      <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors"
            >
              <Icon active={active} />
              <span className={`text-[10px] font-medium ${active ? 'text-indigo-400' : 'text-zinc-500'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
