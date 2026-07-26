import { describe, expect, it } from 'vitest'
import {
  normalizeReadingHistorySearchParams,
  readingHistoryParamsFromSearchParams,
} from '@/utils/Reading/readingHistoryParams'

describe('reading history query mapping', () => {
  it('maps supported URL values to the required API parameters', () => {
    expect(
      readingHistoryParamsFromSearchParams(
        new URLSearchParams(
          'page=3&status=COMPLETED&sort=oldest',
        ),
      ),
    ).toEqual({
      page: 3,
      limit: 10,
      status: 'COMPLETED',
      sort: 'oldest',
    })
  })

  it('normalizes invalid and default URL values', () => {
    expect(
      normalizeReadingHistorySearchParams(
        new URLSearchParams(
          'page=-2&status=UNKNOWN&sort=popular&extra=value',
        ),
      ).toString(),
    ).toBe('')
  })
})
