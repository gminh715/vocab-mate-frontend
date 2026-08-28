import { useQueryClient } from '@tanstack/react-query'
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { readingApi } from '@/api/Reading/ReadingApi'
import type { ReaderProgress } from '@/types/Reading/reading'
import { readingQueryKeys } from '@/hooks/Reading/useReading'

export const PROGRESS_CHANGE_THRESHOLD = 2
export const PROGRESS_SAVE_DELAY_MS = 1_500

export const boundReadingProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100))
}

export const calculateReadingProgress = (
  container: Pick<HTMLElement, 'getBoundingClientRect'>,
  viewportHeight: number,
): number => {
  const bounds = container.getBoundingClientRect()
  if (bounds.height <= 0 || viewportHeight <= 0) return 0

  return boundReadingProgress(
    ((viewportHeight - bounds.top) / bounds.height) * 100,
  )
}

export const isMeaningfulProgressChange = (
  previous: number,
  next: number,
): boolean =>
  boundReadingProgress(next) >=
  boundReadingProgress(previous) + PROGRESS_CHANGE_THRESHOLD

type SaveProgress = (progressPercent: number) => Promise<ReaderProgress>

export class ReadingProgressQueue {
  private timer: ReturnType<typeof setTimeout> | null = null
  private inFlight = false
  private inFlightPromise: Promise<void> | null = null
  private paused = false
  private latestObserved: number
  private latestRequested: number
  private latestConfirmed: number
  private readonly save: SaveProgress
  private readonly onConfirmed: (progress: ReaderProgress) => void

  constructor(
    initialProgress: number,
    save: SaveProgress,
    onConfirmed: (progress: ReaderProgress) => void,
  ) {
    const initial = boundReadingProgress(initialProgress)
    this.latestObserved = initial
    this.latestRequested = initial
    this.latestConfirmed = initial
    this.save = save
    this.onConfirmed = onConfirmed
  }

  observe(value: number): number {
    this.latestObserved = Math.max(
      this.latestObserved,
      boundReadingProgress(value),
    )

    if (
      !this.paused &&
      isMeaningfulProgressChange(
        Math.max(this.latestConfirmed, this.latestRequested),
        this.latestObserved,
      )
    ) {
      this.schedule()
    }

    return this.latestObserved
  }

  flush(): void {
    this.clearTimer()
    if (this.paused) return

    if (this.latestObserved > this.latestRequested) {
      this.latestRequested = this.latestObserved
    }
    this.pump()
  }

  stop(): void {
    this.flush()
  }

  markComplete(): void {
    this.clearTimer()
    this.paused = true
    this.latestObserved = 100
    this.latestRequested = 100
    this.latestConfirmed = 100
  }

  reset(): void {
    this.clearTimer()
    this.paused = false
    this.latestObserved = 0
    this.latestRequested = 0
    this.latestConfirmed = 0
  }

  pauseAndWait(): Promise<void> {
    this.paused = true
    this.clearTimer()
    return this.inFlightPromise ?? Promise.resolve()
  }

  resume(): void {
    this.paused = false
    if (
      isMeaningfulProgressChange(
        Math.max(this.latestConfirmed, this.latestRequested),
        this.latestObserved,
      )
    ) {
      this.schedule()
    }
  }

  private schedule(): void {
    this.clearTimer()
    this.timer = setTimeout(() => {
      this.timer = null
      this.flush()
    }, PROGRESS_SAVE_DELAY_MS)
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private pump(): void {
    if (
      this.paused ||
      this.inFlight ||
      this.latestRequested <= this.latestConfirmed
    ) {
      return
    }

    this.inFlight = true
    const requested = this.latestRequested

    const request = this.save(requested)
      .then((progress) => {
        this.latestConfirmed = Math.max(
          this.latestConfirmed,
          requested,
          boundReadingProgress(progress.progressPercent),
        )
        this.onConfirmed(progress)
      })
      .catch(() => {
        // Progress is best-effort. A later meaningful observation retries it.
      })
      .finally(() => {
        this.inFlight = false
        if (this.inFlightPromise === request) {
          this.inFlightPromise = null
        }
        if (!this.paused && this.latestRequested > requested) {
          this.pump()
        }
      })

    this.inFlightPromise = request
  }
}

interface UseReadingProgressPersistenceOptions {
  articleId: string
  containerRef: RefObject<HTMLElement | null>
  initialProgress: ReaderProgress
  slug: string
}

export const useReadingProgressPersistence = ({
  articleId,
  containerRef,
  initialProgress,
  slug,
}: UseReadingProgressPersistenceOptions) => {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(initialProgress)
  const initialProgressPercentRef = useRef(
    initialProgress.progressPercent,
  )
  const completedRef = useRef(initialProgress.status === 'COMPLETED')
  const queueRef = useRef<ReadingProgressQueue | null>(null)

  useEffect(() => {
    completedRef.current = progress.status === 'COMPLETED'
  }, [progress.status])

  useEffect(() => {
    const queue = new ReadingProgressQueue(
      initialProgressPercentRef.current,
      async (progressPercent) =>
        (
          await readingApi.updateProgress(articleId, {
            progressPercent,
          })
        ).progress,
      (confirmedProgress) => {
        if (completedRef.current) return

        setProgress((current) =>
          confirmedProgress.progressPercent >= current.progressPercent
            ? confirmedProgress
            : current,
        )
        queryClient.setQueryData(
          readingQueryKeys.article(slug),
          (current: unknown) => {
            if (
              typeof current !== 'object' ||
              current === null ||
              !('progress' in current)
            ) {
              return current
            }

            return { ...current, progress: confirmedProgress }
          },
        )
      },
    )
    queueRef.current = queue

    let animationFrame: number | null = null
    const measure = () => {
      animationFrame = null
      if (completedRef.current) return

      const container = containerRef.current
      if (!container) return

      const nextValue = queue.observe(
        calculateReadingProgress(container, window.innerHeight),
      )
      setProgress((current) =>
        nextValue > current.progressPercent
          ? { ...current, progressPercent: nextValue }
          : current,
      )
    }
    const requestMeasure = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(measure)
      }
    }

    requestMeasure()
    window.addEventListener('scroll', requestMeasure, { passive: true })
    window.addEventListener('resize', requestMeasure)

    return () => {
      window.removeEventListener('scroll', requestMeasure)
      window.removeEventListener('resize', requestMeasure)
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }
      queue.stop()
      queueRef.current = null
    }
  }, [
    articleId,
    containerRef,
    queryClient,
    slug,
  ])

  const applyComplete = (completedProgress: ReaderProgress) => {
    completedRef.current = true
    queueRef.current?.markComplete()
    setProgress(completedProgress)
  }

  const prepareProgressAction = (): Promise<void> =>
    queueRef.current?.pauseAndWait() ?? Promise.resolve()

  const resumeProgress = () => {
    queueRef.current?.resume()
  }

  const applyReset = () => {
    completedRef.current = false
    queueRef.current?.reset()
    setProgress({
      articleId,
      status: 'READING',
      progressPercent: 0,
      completedAt: null,
    })
  }

  return {
    progress,
    applyComplete,
    applyReset,
    prepareProgressAction,
    resumeProgress,
  }
}
