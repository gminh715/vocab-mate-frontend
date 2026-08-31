export interface AnalyticsDateFilters {
  from?: string
  to?: string
}

export type AnalyticsOverviewParams = AnalyticsDateFilters

export interface AnalyticsOverview {
  savedVocabulary: number
  articlesCompleted: number
}

export interface RecentDayItem {
  date: string
  isCompleted: boolean
  isToday: boolean
}

export interface StreakAnalytics {
  currentStreak: number
  longestStreak: number
  isTodayCompleted: boolean
  recentDays: RecentDayItem[]
  completedDates?: string[]
}

export interface FsrsMasteryAnalytics {
  total: number
  newCount: number
  learningCount: number
  reviewCount: number
  relearningCount: number
  masteryRate: number
}

export interface ReviewAnalyticsData {
  streak: StreakAnalytics
  mastery: FsrsMasteryAnalytics
}

