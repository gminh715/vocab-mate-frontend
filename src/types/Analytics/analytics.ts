export interface AnalyticsDateFilters {
  from?: string
  to?: string
}

export type AnalyticsOverviewParams = AnalyticsDateFilters

export interface AnalyticsOverview {
  savedVocabulary: number
  articlesCompleted: number
}
