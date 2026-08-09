import { describe, expect, it } from 'vitest'
import {
  analyticsDateRangeError,
  analyticsFiltersFromSearchParams,
  analyticsRequestParams,
  normalizeAnalyticsSearchParams,
  quizAnalyticsRequestParams,
  vocabularyAnalyticsRequestParams,
} from '@/utils/Analytics/analyticsParams'
import {
  cefrLevelLabel,
  formatAnalyticsRatio,
  learningStatusLabel,
  questionTypeLabel,
} from '@/utils/Analytics/analyticsPresentation'

describe('learner analytics parameter mapping', () => {
  it('restores valid URL filters and removes unsupported values', () => {
    const filters = analyticsFiltersFromSearchParams(
      new URLSearchParams(
        'from=2026-07-01&to=2026-07-26&groupBy=WEEK&articleId=550e8400-e29b-41d4-a716-446655440000&section=reviews&ignored=value',
      ),
    )

    expect(filters).toEqual({
      from: '2026-07-01',
      to: '2026-07-26',
      groupBy: 'WEEK',
      articleId: '550e8400-e29b-41d4-a716-446655440000',
      section: 'reviews',
    })
    expect(
      normalizeAnalyticsSearchParams(
        new URLSearchParams(
          'from=bad&to=2026-07-26&groupBy=YEAR&articleId=bad',
        ),
      ).toString(),
    ).toBe('to=2026-07-26')
  })

  it('creates offset-bearing ISO instants in the local app timezone', () => {
    const params = analyticsRequestParams({
      from: '2026-07-01',
      to: '2026-07-26',
    })

    expect(params.from).toBe(new Date(2026, 6, 1).toISOString())
    expect(params.to).toBe(new Date(2026, 6, 26).toISOString())
  })

  it('scopes groupBy to vocabulary and articleId to quizzes', () => {
    const filters = {
      from: '2026-07-01',
      to: '2026-07-26',
      groupBy: 'MONTH',
      articleId: '550e8400-e29b-41d4-a716-446655440000',
    } as const

    expect(vocabularyAnalyticsRequestParams(filters)).toMatchObject({
      groupBy: 'MONTH',
    })
    expect(vocabularyAnalyticsRequestParams(filters)).not.toHaveProperty(
      'articleId',
    )
    expect(quizAnalyticsRequestParams(filters)).toMatchObject({
      articleId: filters.articleId,
    })
    expect(quizAnalyticsRequestParams(filters)).not.toHaveProperty('groupBy')
  })

  it('prevents reversed and overlong date ranges', () => {
    expect(
      analyticsDateRangeError({
        from: '2026-07-26',
        to: '2026-07-01',
      }),
    ).toMatch(/must be after/i)
    expect(
      analyticsDateRangeError({
        from: '2025-01-01',
        to: '2026-07-01',
      }),
    ).toMatch(/cannot exceed 366 days/i)
    expect(
      analyticsDateRangeError({
        from: '2026-07-01',
        to: '2026-07-26',
      }),
    ).toBeNull()
  })
})

describe('learner analytics presentation mapping', () => {
  it('maps every learning status, including ignored', () => {
    expect(
      ['NEW', 'LEARNING', 'REVIEWING', 'MASTERED', 'IGNORED'].map(
        learningStatusLabel,
      ),
    ).toEqual(['New', 'Learning', 'Reviewing', 'Mastered', 'Ignored'])
  })

  it('maps every CEFR value explicitly', () => {
    expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(cefrLevelLabel)).toEqual([
      'CEFR A1',
      'CEFR A2',
      'CEFR B1',
      'CEFR B2',
      'CEFR C1',
      'CEFR C2',
    ])
  })

  it('formats zero, invalid, accuracy, and score ratios safely', () => {
    expect(formatAnalyticsRatio(0)).toBe('0%')
    expect(formatAnalyticsRatio(Number.NaN)).toBe('0%')
    expect(formatAnalyticsRatio(0.825)).toBe('82.5%')
    expect(formatAnalyticsRatio(1)).toBe('100%')
  })

  it('maps all question types to learner-facing labels', () => {
    expect(questionTypeLabel('SELECT_MEANING')).toBe('Select meaning')
    expect(questionTypeLabel('SELECT_WORD')).toBe('Select word')
    expect(questionTypeLabel('SELECT_CORRECT_CONTEXT')).toBe(
      'Select correct context',
    )
    expect(questionTypeLabel('FILL_BLANK')).toBe('Fill in the blank')
  })
})
