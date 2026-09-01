import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { ArticleCefrChip } from '@/components/Article/ArticleChips'
import { ArticleCover } from '@/components/Article/ArticleCover'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import { LoadingState } from '@/components/Shared/LoadingState'
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

interface HistoryCardProps {
  item: ReadingHistoryItem
  onReset: (item: ReadingHistoryItem) => void
}

function HistoryCard({ item, onReset }: HistoryCardProps) {
  const { t } = useTranslation('articles')
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
            label={isCompleted ? t('history.status.completed') : t('history.status.inProgress')}
          />
          {!isAvailable ? (
            <Chip size="small" label={t('history.status.archived')} variant="outlined" />
          ) : null}
        </Stack>

        <Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: '"Merriweather", serif',
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
              {isCompleted ? t('history.progress.complete') : t('history.progress.inProgress')}
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
            aria-label={t('history.progressAriaLabel', { title: item.article.title })}
            sx={{ height: 7, borderRadius: 999 }}
          />
        </Box>

        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {t('history.lastRead', { date: dateFormatter.format(new Date(item.lastReadAt)) })}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {isAvailable ? (
            <Button
              component={RouterLink}
              to={readerPath(item.article.slug)}
              variant="contained"
            >
              {isCompleted ? t('history.actions.readAgain') : t('history.actions.continue')}
            </Button>
          ) : (
            <Button disabled variant="contained">
              {t('history.actions.unavailable')}
            </Button>
          )}
          <Button color="inherit" onClick={() => onReset(item)}>
            {t('history.actions.reset')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}

export function ReadingHistoryPage() {
  const { t } = useTranslation('articles')
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

  const getHistoryErrorMessage = (error: unknown): string => {
    const apiError = normalizeApiError(error)
    if (apiError.status === 400) return t('history.errors.invalidFilters')
    return apiError.status === 0 ? apiError.message : t('history.errors.loadError')
  }

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
        <Box sx={{ maxWidth: 720 }}>
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: 40, sm: 52 },
              textWrap: 'balance',
            }}
          >
            {t('history.title')}
          </Typography>
        </Box>
        {listData ? (
          <Typography
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {numberFormatter.format(listData.meta.total)}{' '}
            {t('history.article', { count: listData.meta.total })}
          </Typography>
        ) : null}
      </Box>

      <Paper
        component="section"
        aria-label={t('history.filters.ariaLabel')}
        variant="outlined"
        sx={{ p: { xs: 1.5, sm: 1.75 } }}
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
            size="small"
            select
            label={t('history.filters.status')}
            name="status"
            value={params.status ?? ''}
            onChange={(event) =>
              updateParams({
                status: event.target.value as ReadingStatus | '',
              })
            }
          >
            <MenuItem value="">{t('history.filters.allStatuses')}</MenuItem>
            <MenuItem value="READING">{t('history.filters.inProgress')}</MenuItem>
            <MenuItem value="COMPLETED">{t('history.filters.completed')}</MenuItem>
          </TextField>
          <TextField
            size="small"
            select
            label={t('history.filters.sort')}
            name="sort"
            value={params.sort}
            onChange={(event) =>
              updateParams({
                sort: event.target.value as ReadingHistorySort,
              })
            }
          >
            <MenuItem value="newest">{t('history.filters.recentlyRead')}</MenuItem>
            <MenuItem value="oldest">{t('history.filters.oldestActivity')}</MenuItem>
          </TextField>
          <Button
            size="small"
            variant="outlined"
            disabled={!hasFilter && params.sort === 'newest'}
            onClick={() => setSearchParams(new URLSearchParams())}
          >
            {t('history.filters.clearFilters')}
          </Button>
        </Box>
      </Paper>

      {historyQuery.isPending ? (
        <LoadingState size={34} />
      ) : historyQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => historyQuery.refetch()}>
              {t('history.errors.tryAgain')}
            </Button>
          }
        >
          {getHistoryErrorMessage(historyQuery.error)}
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
                ? t('history.empty.withFilter')
                : t('history.empty.noHistory')}
            </Typography>
            <Typography color="text.secondary">
              {hasFilter
                ? t('history.empty.withFilterSubtitle')
                : t('history.empty.noHistorySubtitle')}
            </Typography>
            {hasFilter ? (
              <Button
                variant="outlined"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                {t('history.empty.clearFilters')}
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : listData ? (
        <>
          <Stack
            component="section"
            aria-label={t('history.pagination.resultsAriaLabel')}
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
              aria-label={t('history.pagination.ariaLabel')}
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
        title={t('history.resetDialog.title')}
        description={t('history.resetDialog.description')}
        confirmLabel={t('history.resetDialog.confirmLabel')}
        isPending={resetMutation.isPending}
        errorMessage={
          resetMutation.error
            ? t('history.errors.resetError')
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
