export type Category = 'university' | 'clinic' | 'personal' | 'projects'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type Status = 'not_started' | 'in_progress' | 'completed' | 'overdue'
export type Urgency = 'green' | 'yellow' | 'orange' | 'red'

export interface Deadline {
  id: string
  title: string
  description?: string
  category: Category
  dueDate: string // ISO date
  estimatedHours: number
  hoursPerDay: number
  startBy: string // calculated
  status: Status
  hoursLogged: number
  confidence?: number // 1-5 rating on completion
  performanceRating?: number // 1-10 auto-calculated
  speedRatio?: number // estimatedHours / actualHours
  createdAt: string
  completedAt?: string
}

export interface PerformanceRecord {
  deadlineId: string
  title: string
  category: Category
  estimatedHours: number
  actualHours: number
  speedRatio: number
  performanceRating: number
  daysEarly: number
  completedAt: string
}

export interface Settings {
  name: string
  defaultHoursPerDay: number
  notificationsEnabled: boolean
}
