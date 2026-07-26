import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { ArticleCefrChip } from '@/components/Article/ArticleChips'
import { ArticleCover } from '@/components/Article/ArticleCover'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import { normalizeApiError } from '@/config/apiClient'
import {
  useReadingHistoryQuery,
  useResetReadingMutation,
} from '@/hooks/Reading/useReading'
import type {
  ReadingHistoryItem,
  ReadingHistorySort,
  ReadingStatus,
} from '@/types/Reading/reading'
import {
  normalizeReadingHistorySearchParams,
  readingHistoryParamsFromSearchParams,
  readingHistorySearchParamsFromParams,
} from '@/utils/Reading/readingHistoryParams'
import { readerPath } from '@/utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const numberFormatter = new Intl.NumberFormat()
const progressFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

const historyErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 400) {
    return 'These history filters are not valid. Clear them and try again.'
  }

  return apiError.status === 0
    ? apiError.message
    : 'Reading history could not be loaded. Try again.'
}

interface HistoryCardProps {
  item: ReadingHistoryItem
  onReset: (item: ReadingHistoryItem) => void
}

function HistoryCard({ item, onReset }: HistoryCardProps) {
  const isCompleted = item.status === 'COMPLETED'
  const isAvailable = item.article.status === 'PUBLISHED'

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: '220px minmax(0, 1fr)',
        },
        overflow: 'hidden',
      }}
    >
      <ArticleCover
        categoryName={item.article.category.name}
        thumbnailUrl={item.article.thumbnailUrl}
      />

      <Stack spacing={2} sx={{ minWidth: 0, p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
        >
          <ArticleCefrChip level={item.article.cefrLevel} />
          <Chip
            size="small"
            color={isCompleted ? 'success' : 'default'}
            label={isCompleted ? 'Completed' : 'In progress'}
          />
          {!isAvailable ? (
            <Chip size="small" label="Archived" variant="outlined" />
          ) : null}
        </Stack>

        <Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: 'Georgia, serif',
              fontSize: { xs: 24, sm: 27 },
              fontWeight: 700,
              lineHeight: 1.2,
              overflowWrap: 'anywhere',
              textWrap: 'balance',
            }}
          >
            {item.article.title}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              mt: 1,
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {item.article.summary}
          </Typography>
        </Box>

        <Box>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', mb: 0.75 }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 750 }}>
              {isCompleted ? 'Reading complete' : 'Reading progress'}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
            >
              {progressFormatter.format(item.progressPercent)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={item.progressPercent}
            aria-label={`Reading progress for ${item.article.title}`}
            sx={{ height: 7, borderRadius: 999 }}
          />
        </Box>

        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
          Last read {dateFormatter.format(new Date(item.lastReadAt))}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {isAvailable ? (
            <Button
              component={RouterLink}
              to={readerPath(item.article.slug)}
              variant="contained"
            >
              {isCompleted ? 'Read again' : 'Continue reading'}
            </Button>
          ) : (
            <Button disabled variant="contained">
              Article unavailable
            </Button>
          )}
          <Button color="inherit" onClick={() => onReset(item)}>
            Reset progress
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}

export function ReadingHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [resetItem, setResetItem] =
    useState<ReadingHistoryItem | null>(null)
  const searchString = searchParams.toString()
  const params = readingHistoryParamsFromSearchParams(searchParams)
  const historyQuery = useReadingHistoryQuery(params)
  const resetMutation = useResetReadingMutation()

  useEffect(() => {
    const normalized = normalizeReadingHistorySearchParams(searchParams)

    if (normalized.toString() !== searchString) {
      setSearchParams(normalized, { replace: true })
    }
  }, [searchParams, searchString, setSearchParams])

  const updateParams = (
    updates: Partial<{
      page: number
      status: ReadingStatus | ''
      sort: ReadingHistorySort
    }>,
    resetPage = true,
  ) => {
    setSearchParams((current) => {
      const next = readingHistoryParamsFromSearchParams(current)
      if (resetPage) next.page = 1
      if (updates.page !== undefined) next.page = updates.page
      if (updates.status !== undefined) {
        next.status = updates.status || undefined
      }
      if (updates.sort !== undefined) next.sort = updates.sort
      return readingHistorySearchParamsFromParams(next)
    })
  }

  const confirmReset = async () => {
    if (!resetItem) return

    try {
      const shouldShowPreviousPage =
        params.page > 1 && listData?.items.length === 1
      await resetMutation.mutateAsync(resetItem.articleId)
      setResetItem(null)
      if (shouldShowPreviousPage) {
        updateParams({ page: params.page - 1 }, false)
      }
    } catch {
      // The confirmation dialog presents the normalized mutation error.
    }
  }

  const listData = historyQuery.data
  const hasFilter = params.status !== undefined

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          gap: 2,
          alignItems: 'end',
          borderBottom: 1,
          borderColor: 'divider',
          pb: { xs: 3, md: 4 },
        }}
      >
        <Stack spacing={1.25} sx={{ maxWidth: 720 }}>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Your reading trail
          </Typography>
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: 40, sm: 50, md: 58 },
              textWrap: 'balance',
            }}
          >
            Reading history
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 640, fontSize: { sm: 18 }, textWrap: 'pretty' }}
          >
            Pick up an article where you left off or revisit a completed
            read.
          </Typography>
        </Stack>
        {listData ? (
          <Typography
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {numberFormatter.format(listData.meta.total)}{' '}
            {listData.meta.total === 1 ? 'article' : 'articles'}
          </Typography>
        ) : null}
      </Box>

      <Paper
        component="section"
        aria-label="Reading history filters"
        variant="outlined"
        sx={{ p: { xs: 2, sm: 2.5 } }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr)) auto',
            },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <TextField
            select
            label="Status"
            name="status"
            value={params.status ?? ''}
            onChange={(event) =>
              updateParams({
                status: event.target.value as ReadingStatus | '',
              })
            }
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="READING">In progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </TextField>
          <TextField
            select
            label="Sort"
            name="sort"
            value={params.sort}
            onChange={(event) =>
              updateParams({
                sort: event.target.value as ReadingHistorySort,
              })
            }
          >
            <MenuItem value="newest">Recently read</MenuItem>
            <MenuItem value="oldest">Oldest activity</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            disabled={!hasFilter && params.sort === 'newest'}
            onClick={() => setSearchParams(new URLSearchParams())}
          >
            Clear filters
          </Button>
        </Box>
      </Paper>

      {historyQuery.isPending ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={34} />
            <Typography color="text.secondary">
              Loading reading history…
            </Typography>
          </Stack>
        </Paper>
      ) : historyQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => historyQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {historyErrorMessage(historyQuery.error)}
        </Alert>
      ) : listData && listData.items.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            display: 'grid',
            minHeight: 280,
            placeItems: 'center',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 500 }}>
            <Typography variant="h2" sx={{ fontSize: 28 }}>
              {hasFilter
                ? 'No reading matches this filter'
                : 'Your reading history is empty'}
            </Typography>
            <Typography color="text.secondary">
              {hasFilter
                ? 'Choose another status or clear the filter.'
                : 'Open an article and start reading to see it here.'}
            </Typography>
            {hasFilter ? (
              <Button
                variant="outlined"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                Clear filters
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : listData ? (
        <>
          <Stack
            component="section"
            aria-label="Reading history results"
            spacing={2}
          >
            {listData.items.map((item) => (
              <HistoryCard
                key={item.articleId}
                item={item}
                onReset={(selected) => {
                  resetMutation.reset()
                  setResetItem(selected)
                }}
              />
            ))}
          </Stack>

          {listData.meta.totalPages > 1 ? (
            <Stack
              component="nav"
              aria-label="Reading history pages"
              sx={{ alignItems: 'center' }}
            >
              <Pagination
                page={listData.meta.page}
                count={listData.meta.totalPages}
                color="primary"
                disabled={historyQuery.isPlaceholderData}
                onChange={(_, page) => updateParams({ page }, false)}
              />
            </Stack>
          ) : null}
        </>
      ) : null}

      <ConfirmationDialog
        open={resetItem !== null}
        title="Reset Reading Progress?"
        description="This article will be removed from reading history. Saved vocabulary and quiz history will not be deleted."
        confirmLabel="Reset Progress"
        isPending={resetMutation.isPending}
        errorMessage={
          resetMutation.error
            ? 'Reading progress could not be reset. Try again.'
            : null
        }
        onCancel={() => {
          resetMutation.reset()
          setResetItem(null)
        }}
        onConfirm={() => void confirmReset()}
      />
    </Stack>
  )
}
