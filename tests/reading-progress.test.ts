import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PROGRESS_SAVE_DELAY_MS,
  ReadingProgressQueue,
  boundReadingProgress,
  calculateReadingProgress,
} from '@/hooks/Reading/useReadingProgressPersistence'
import type { ReaderProgress } from '@/types/Reading/reading'

const progress = (progressPercent: number): ReaderProgress => ({
  articleId: 'article-1',
  status: 'READING',
  progressPercent,
  lastBlockKey: null,
  completedAt: null,
})

describe('reading progress calculation and persistence', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('bounds calculated and direct progress values to 0–100', () => {
    expect(boundReadingProgress(-15)).toBe(0)
    expect(boundReadingProgress(34.567)).toBe(34.57)
    expect(boundReadingProgress(140)).toBe(100)
    expect(boundReadingProgress(Number.NaN)).toBe(0)

    const container = {
      getBoundingClientRect: () =>
        ({ top: -200, height: 500 }) as DOMRect,
    }
    expect(calculateReadingProgress(container, 600)).toBe(100)
  })

  it('debounces persistence and ignores insignificant changes', async () => {
    vi.useFakeTimers()
    const save = vi.fn(async (value: number) => progress(value))
    const queue = new ReadingProgressQueue(20, save, vi.fn())

    queue.observe(21.99)
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS)
    expect(save).not.toHaveBeenCalled()

    queue.observe(22)
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS - 1)
    expect(save).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledWith(22)
  })

  it('serializes writes and never sends a stale lower observation', async () => {
    vi.useFakeTimers()
    let resolveFirst: ((value: ReaderProgress) => void) | undefined
    const first = new Promise<ReaderProgress>((resolve) => {
      resolveFirst = resolve
    })
    const save = vi
      .fn<(value: number) => Promise<ReaderProgress>>()
      .mockReturnValueOnce(first)
      .mockImplementation(async (value) => progress(value))
    const confirmed = vi.fn()
    const queue = new ReadingProgressQueue(20, save, confirmed)

    queue.observe(30)
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenLastCalledWith(30)

    queue.observe(25)
    queue.observe(40)
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS)
    expect(save).toHaveBeenCalledTimes(1)

    resolveFirst?.(progress(30))
    await vi.advanceTimersByTimeAsync(0)

    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith(40)
    expect(save.mock.calls.map(([value]) => value)).toEqual([30, 40])
  })

  it('waits for an in-flight write before a terminal action and stays paused', async () => {
    vi.useFakeTimers()
    let resolveSave: ((value: ReaderProgress) => void) | undefined
    const pendingSave = new Promise<ReaderProgress>((resolve) => {
      resolveSave = resolve
    })
    const save = vi.fn(() => pendingSave)
    const queue = new ReadingProgressQueue(10, save, vi.fn())

    queue.observe(30)
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS)
    expect(save).toHaveBeenCalledWith(30)

    let terminalActionStarted = false
    const terminalAction = queue.pauseAndWait().then(() => {
      terminalActionStarted = true
    })
    queue.observe(60)
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS)
    expect(terminalActionStarted).toBe(false)
    expect(save).toHaveBeenCalledTimes(1)

    resolveSave?.(progress(30))
    await terminalAction
    expect(terminalActionStarted).toBe(true)

    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS)
    expect(save).toHaveBeenCalledTimes(1)
  })
})
