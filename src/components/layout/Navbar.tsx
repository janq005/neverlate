'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const secondaryLinks = [
  { href: '/habits', label: 'Habits' },
  { href: '/timer', label: 'Timer' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/review', label: 'Review' },
]

export default function Navbar() {
  const pathname = usePathname()
  const showSecondary = secondaryLinks.some(l => pathname === l.href)

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            NeverLate
          </span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {secondaryLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                pathname === link.href
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/settings"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
            showSecondary
              ? 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              : 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="Settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>
    </header>
  )
}
