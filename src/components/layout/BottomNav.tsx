'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const primaryLinks = [
  { href: '/', label: 'Today', icon: SunIcon },
  { href: '/add', label: 'Add', icon: PlusIcon },
  { href: '/deadlines', label: 'All', icon: ListIcon },
  { href: '/performance', label: 'Stats', icon: ChartIcon },
]

const moreLinks = [
  { href: '/habits', label: 'Habits', icon: '🔁' },
  { href: '/timer', label: 'Timer', icon: '⏱' },
  { href: '/schedule', label: 'Schedule', icon: '📅' },
  { href: '/review', label: 'Review', icon: '📊' },
  { href: '/calendar', label: 'Calendar', icon: '🗓' },
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

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
    </svg>
  )
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = moreLinks.some(l => pathname === l.href)

  return (
    <>
      {/* More overlay */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-lg px-4">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md p-4 shadow-2xl">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">More</p>
              <div className="grid grid-cols-5 gap-2">
                {moreLinks.map(link => {
                  const active = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
                        active ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-800/60 text-zinc-400'
                      }`}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span className={`text-[10px] font-medium ${active ? 'text-indigo-400' : 'text-zinc-500'}`}>
                        {link.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/60 pb-safe">
        <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
          {primaryLinks.map(({ href, label, icon: Icon }) => {
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

          <button
            onClick={() => setShowMore(s => !s)}
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors"
          >
            <MoreIcon active={isMoreActive || showMore} />
            <span className={`text-[10px] font-medium ${isMoreActive || showMore ? 'text-indigo-400' : 'text-zinc-500'}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
