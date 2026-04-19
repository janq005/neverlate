'use client'

import { Deadline } from './types'
import { getDailyPlan, getNotificationText, getUrgency } from './scheduler'

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showNotification(title: string, body: string, icon = '/icons/icon-192.png') {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return
  new Notification(title, { body, icon })
}

export function scheduleDailyMorningNotification(deadlines: Deadline[]) {
  if (typeof window === 'undefined') return
  const plan = getDailyPlan(deadlines)
  if (plan.length === 0) return

  const totalHours = plan.reduce((sum, t) => sum + t.hoursToday, 0)
  showNotification(
    '☀️ NeverLate — Today\'s Plan',
    `${plan.length} task${plan.length > 1 ? 's' : ''}, ${totalHours.toFixed(1)} hours total`
  )
}

export function checkStartByAlerts(deadlines: Deadline[]) {
  deadlines.forEach(d => {
    if (d.status === 'completed') return
    const urgency = getUrgency(d)
    if (urgency === 'yellow' || urgency === 'orange' || urgency === 'red') {
      const text = getNotificationText(d)
      const title = urgency === 'red' ? '🚨 Critical Deadline' :
        urgency === 'orange' ? '🔥 Behind Schedule' : '⚠️ Start Soon'
      showNotification(title, text)
    }
  })
}
