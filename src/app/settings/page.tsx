'use client'

import { useEffect, useRef, useState } from 'react'
import { getSettings, saveSettings, exportData, importData } from '@/lib/storage'
import { Settings } from '@/lib/types'
import { requestNotificationPermission } from '@/lib/notifications'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ name: 'Titas', defaultHoursPerDay: 1.5, notificationsEnabled: true })
  const [saved, setSaved] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `neverlate-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importData(ev.target?.result as string)
        setSettings(getSettings())
        alert('Data imported successfully!')
      } catch {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearAll = () => {
    if (!clearConfirm) { setClearConfirm(true); return }
    localStorage.removeItem('neverlate_deadlines')
    localStorage.removeItem('neverlate_settings')
    setSettings({ name: 'Titas', defaultHoursPerDay: 1.5, notificationsEnabled: true })
    setClearConfirm(false)
    alert('All data cleared.')
  }

  const handleNotificationToggle = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission()
      if (granted) setSettings(s => ({ ...s, notificationsEnabled: true }))
    } else {
      setSettings(s => ({ ...s, notificationsEnabled: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Personalize NeverLate</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Profile</h2>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Your Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={e => setSettings(s => ({ ...s, name: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-zinc-400">Default Hours / Day</label>
              <span className="text-sm font-semibold text-indigo-400">{settings.defaultHoursPerDay}h</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={settings.defaultHoursPerDay}
              onChange={e => setSettings(s => ({ ...s, defaultHoursPerDay: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Google Calendar */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Google Calendar</h2>
          <p className="text-xs text-zinc-500">Used in the Schedule page to show your events and calculate free hours.</p>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">API Key</label>
            <input
              type="text"
              placeholder="AIzaSy..."
              value={settings.googleCalendarApiKey ?? ''}
              onChange={e => setSettings(s => ({ ...s, googleCalendarApiKey: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">Calendar ID</label>
            <input
              type="text"
              placeholder="yourname@gmail.com or ID from calendar settings"
              value={settings.googleCalendarId ?? ''}
              onChange={e => setSettings(s => ({ ...s, googleCalendarId: e.target.value }))}
              className="w-full rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Pomodoro */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pomodoro Timer</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-zinc-400">Work interval</label>
              <span className="text-sm font-semibold text-indigo-400">{settings.pomodoroWorkMinutes ?? 25} min</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={settings.pomodoroWorkMinutes ?? 25}
              onChange={e => setSettings(s => ({ ...s, pomodoroWorkMinutes: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-zinc-400">Break interval</label>
              <span className="text-sm font-semibold text-emerald-400">{settings.pomodoroBreakMinutes ?? 5} min</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={settings.pomodoroBreakMinutes ?? 5}
              onChange={e => setSettings(s => ({ ...s, pomodoroBreakMinutes: Number(e.target.value) }))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">Push Notifications</p>
              <p className="text-xs text-zinc-500">Daily plan + deadline alerts</p>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-indigo-500' : 'bg-zinc-700'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.notificationsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 text-sm transition-colors"
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {/* Data */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data</h2>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/40 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700/40 transition-colors"
            >
              Export JSON Backup
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/40 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700/40 transition-colors"
            >
              Import JSON Backup
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>

        {/* Danger */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h2>
          <button
            onClick={handleClearAll}
            className={`w-full rounded-lg border py-2.5 text-sm font-medium transition-colors ${
              clearConfirm
                ? 'border-red-500/60 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'border-red-500/20 bg-transparent text-red-400 hover:bg-red-500/10'
            }`}
          >
            {clearConfirm ? '⚠️ Tap again to confirm — this is permanent' : 'Clear All Data'}
          </button>
          {clearConfirm && (
            <button
              onClick={() => setClearConfirm(false)}
              className="w-full rounded-lg border border-zinc-700/60 py-2 text-xs text-zinc-400 hover:bg-zinc-800/40 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
