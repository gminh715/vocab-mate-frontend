import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { useReviewHistoryQuery } from '@/hooks/Review/useReviews'
import type {
  ReviewHistoryItem,
  ReviewSessionStatus,
} from '@/types/Review/review'
import {
  reviewSessionPath,
  reviewSummaryPath,
  reviewStartPath,
} from '@/utils/paths'

const PAGE_SIZE = 10
const REVIEW_STATUSES: ReviewSessionStatus[] = [
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
]
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
})
const integerFormatter = new Intl.NumberFormat()

const positivePage = (value: string | null): number => {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function HistoryCard({ item }: { item: ReviewHistoryItem }) {
  const { t } = useTranslation('review')
  const { session, aggregates } = item
  const reviewMode =
    session.reviewGoal ??
    (session.sessionType === 'DAILY_REVIEW' ? 'BALANCED' : null)
  const sourceTitle =
    item.article?.title ??
    item.quiz?.title ??
    t(`plan.sessionTypes.${session.sessionType}`)
  const statusColor =
    session.status === 'COMPLETED'
      ? 'success'
      : session.status === 'IN_PROGRESS'
        ? 'primary'
        : 'default'

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        p: { xs: 2.25, sm: 3 },
        borderLeft: 6,
        borderLeftColor:
          session.status === 'COMPLETED'
            ? 'primary.main'
            : session.status === 'IN_PROGRESS'
              ? 'secondary.main'
              : 'divider',
      }}
    >
      <Stack spacing={2.25}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'start' } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h2"
              variant="h2"
              sx={{ fontSize: { xs: 23, sm: 27 }, overflowWrap: 'anywhere' }}
            >
              {sourceTitle}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}
            >
              {dateFormatter.format(new Date(session.startedAt))}
            </Typography>
          </Box>
          <Chip
            size="small"
            color={statusColor}
            label={t(`history.status.${session.status}`)}
          />
        </Stack>

        {session.planSummary ? (
          <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {session.planSummary}
          </Typography>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {[
            {
              label: t('history.metrics.accuracy'),
              value: percentFormatter.format(aggregates.accuracy),
            },
            {
              label: t('history.metrics.correct'),
              value: `${aggregates.correctCount}/${aggregates.answeredCount}`,
            },
            {
              label: t('history.metrics.mode'),
              value: reviewMode
                ? t(`plan.goals.${reviewMode}`)
                : '—',
            },
          ].map((metric) => (
            <Box key={metric.label} sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 850, fontVariantNumeric: 'tabular-nums' }}>
                {metric.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metric.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {session.status === 'COMPLETED' ? (
          <Button
            component={RouterLink}
            to={reviewSummaryPath(session.id)}
            variant="outlined"
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('history.actions.viewSummary')}
          </Button>
        ) : session.status === 'IN_PROGRESS' ? (
          <Button
            component={RouterLink}
            to={reviewSessionPath(session.id)}
            variant="contained"
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('history.actions.resume')}
          </Button>
        ) : null}
      </Stack>
    </Card>
  )
}

export function ReviewHistoryPage() {
  const { t } = useTranslation('review')
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()
  const params = useMemo(() => {
    const current = new URLSearchParams(searchString)
    const statusValue = current.get('status')
    const status = REVIEW_STATUSES.find((candidate) => candidate === statusValue)
    return {
      page: positivePage(current.get('page')),
      limit: PAGE_SIZE,
      ...(status ? { status } : {}),
    }
  }, [searchString])
  const historyQuery = useReviewHistoryQuery(params)
  const data = historyQuery.data

  useEffect(() => {
    const normalized = new URLSearchParams()
    if (params.page > 1) normalized.set('page', String(params.page))
    if (params.status) normalized.set('status', params.status)
    if (normalized.toString() !== searchString) {
      setSearchParams(normalized, { replace: true })
    }
  }, [params, searchString, setSearchParams])

  const updateStatus = (status: ReviewSessionStatus | '') => {
    setSearchParams(status ? { status } : {})
  }

  const errorMessage = historyQuery.isError
    ? (() => {
        const error = normalizeApiError(historyQuery.error)
        return error.status === 400
          ? t('history.errors.invalidFilters')
          : t('history.errors.load')
      })()
    : null

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
        <Stack spacing={1} sx={{ maxWidth: 720 }}>
          <Typography color="primary.main" sx={{ fontSize: 12, fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {t('history.eyebrow')}
          </Typography>
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 40, sm: 52 } }}>
            {t('history.title')}
          </Typography>
          <Typography color="text.secondary">{t('history.subtitle')}</Typography>
        </Stack>
        {data ? (
          <Typography color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {t('history.sessionCount', {
              count: data.meta.total,
              formattedCount: integerFormatter.format(data.meta.total),
            })}
          </Typography>
        ) : null}
      </Box>

      <Paper component="section" aria-label={t('history.filters.ariaLabel')} variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
          <TextField
            select
            size="small"
            name="status"
            label={t('history.filters.status')}
            value={params.status ?? ''}
            onChange={(event) => updateStatus(event.target.value as ReviewSessionStatus | '')}
            sx={{ maxWidth: { sm: 300 } }}
          >
            <MenuItem value="">{t('history.filters.all')}</MenuItem>
            {REVIEW_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {t(`history.status.${status}`)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            disabled={!params.status}
            onClick={() => updateStatus('')}
          >
            {t('history.filters.clear')}
          </Button>
        </Stack>
      </Paper>

      {historyQuery.isPending ? (
        <Paper variant="outlined" sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}>
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={34} />
            <Typography color="text.secondary">{t('history.loading')}</Typography>
          </Stack>
        </Paper>
      ) : errorMessage ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void historyQuery.refetch()}>
              {t('history.errors.tryAgain')}
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      ) : data && data.items.length === 0 ? (
        <Paper variant="outlined" sx={{ minHeight: 260, display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 520 }}>
            <Typography variant="h2" sx={{ fontSize: 28 }}>
              {params.status ? t('history.empty.filtered') : t('history.empty.title')}
            </Typography>
            <Typography color="text.secondary">
              {params.status ? t('history.empty.filteredSubtitle') : t('history.empty.subtitle')}
            </Typography>
            {params.status ? (
              <Button variant="outlined" onClick={() => updateStatus('')}>
                {t('history.filters.clear')}
              </Button>
            ) : (
              <Button component={RouterLink} to={reviewStartPath({ sessionType: 'DAILY_REVIEW' })} variant="contained">
                {t('history.actions.start')}
              </Button>
            )}
          </Stack>
        </Paper>
      ) : data ? (
        <>
          <Stack component="section" aria-label={t('history.resultsLabel')} spacing={2}>
            {data.items.map((item) => (
              <HistoryCard key={item.session.id} item={item} />
            ))}
          </Stack>
          {data.meta.totalPages > 1 ? (
            <Stack component="nav" aria-label={t('history.pagination')} sx={{ alignItems: 'center' }}>
              <Pagination
                page={data.meta.page}
                count={data.meta.totalPages}
                color="primary"
                disabled={historyQuery.isPlaceholderData}
                onChange={(_, page) => {
                  const next = new URLSearchParams(searchParams)
                  if (page > 1) next.set('page', String(page))
                  else next.delete('page')
                  setSearchParams(next)
                }}
              />
            </Stack>
          ) : null}
        </>
      ) : null}
    </Stack>
  )
}
