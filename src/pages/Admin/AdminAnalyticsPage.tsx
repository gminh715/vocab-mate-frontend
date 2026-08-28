import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import {
  useAdminAnalyticsOverviewQuery,
  useAdminContentAnalyticsQuery,
  useAdminUserAnalyticsQuery,
} from '@/hooks/Admin/useAdminAnalytics'
import { useAdminCategoryOptionsQuery } from '@/hooks/Admin/useAdminCategories'
import type {
  AdminAnalyticsOverview,
  LearningDistribution,
  RegistrationTrendBucket,
} from '@/types/Admin/adminAnalytics'
import { USER_STATUSES } from '@/types/Auth/auth'
import {
  adminAnalyticsFiltersFromSearchParams,
  analyticsDateRangeError,
  analyticsRequestParams,
  contentAnalyticsRequestParams,
  userAnalyticsRequestParams,
} from '@/utils/Admin/adminAnalyticsParams'

const integerFormatter = new Intl.NumberFormat()
const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
})

const formatInteger = (value: number): string => integerFormatter.format(value)
const formatPercent = (value: number): string => percentFormatter.format(value)
const displayBucket = (bucket: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${bucket}T00:00:00Z`))

const errorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

interface AsyncSectionProps {
  title: string
  description: string
  isPending: boolean
  error: unknown | null
  onRetry: () => void
  children: ReactNode
}

function AsyncSection({
  title,
  description,
  isPending,
  error,
  onRetry,
  children,
}: AsyncSectionProps) {
  return (
    <Stack component="section" spacing={2} aria-labelledby={`${title.replace(/\s+/gu, '-').toLowerCase()}-title`}>
      <Box>
        <Typography
          id={`${title.replace(/\s+/gu, '-').toLowerCase()}-title`}
          variant="h2"
          sx={{ fontSize: { xs: 26, md: 30 } }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      {isPending ? (
        <Paper variant="outlined" sx={{ minHeight: 180, display: 'grid', placeItems: 'center' }}>
          <Stack role="status" spacing={1.25} sx={{ alignItems: 'center' }}>
            <CircularProgress size={30} />
            <Typography color="text.secondary">Loading {title.toLowerCase()}…</Typography>
          </Stack>
        </Paper>
      ) : error ? (
        <Alert
          severity="error"
          action={<Button color="inherit" onClick={onRetry}>Try again</Button>}
        >
          {errorMessage(error)}
        </Alert>
      ) : (
        children
      )}
    </Stack>
  )
}

const metricDefinitions: Array<{
  key: keyof AdminAnalyticsOverview
  label: string
  detail: string
}> = [
  { key: 'users', label: 'Users', detail: 'Current accounts, all statuses' },
  { key: 'activeUsers', label: 'Active learners', detail: 'Distinct activity in this range' },
  { key: 'articles', label: 'Articles', detail: 'Current content, all statuses' },
  { key: 'publishedArticles', label: 'Published', detail: 'Currently available articles' },
  { key: 'savedVocabulary', label: 'Vocabulary saves', detail: 'New saves in this range' },
]

function OverviewMetrics({ data }: { data: AdminAnalyticsOverview }) {
  const allZero = metricDefinitions.every(({ key }) => data[key] === 0)
  return (
    <Stack spacing={2}>
      {allZero ? (
        <Alert severity="info">
          No operational activity or current records were returned for these filters.
        </Alert>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {metricDefinitions.map(({ key, label, detail }) => (
          <Paper
            key={key}
            variant="outlined"
            sx={{
              p: 2.5,
              minHeight: 142,
              borderTop: 4,
              borderTopColor: key === 'activeUsers' ? 'secondary.main' : 'primary.main',
            }}
          >
            <Typography color="text.secondary" sx={{ fontWeight: 750 }}>
              {label}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontFamily: '"Merriweather", serif',
                fontSize: 36,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatInteger(data[key])}
            </Typography>
            <Typography variant="body2" color="text.secondary">{detail}</Typography>
          </Paper>
        ))}
      </Box>
    </Stack>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography color="text.secondary">{message}</Typography>
    </Paper>
  )
}

function RelativeBar({
  value,
  maximum,
  color = 'primary.main',
}: {
  value: number
  maximum: number
  color?: string
}) {
  const width = maximum > 0 ? Math.max(0, Math.min(100, (value / maximum) * 100)) : 0
  return (
    <Box
      aria-hidden="true"
      sx={{ height: 8, mt: 0.75, overflow: 'hidden', borderRadius: 99, bgcolor: 'divider' }}
    >
      <Box sx={{ width: `${width}%`, height: '100%', bgcolor: color, borderRadius: 99 }} />
    </Box>
  )
}

function RegistrationsTrend({ items }: { items: RegistrationTrendBucket[] }) {
  if (items.length === 0) {
    return <EmptyPanel message="No registration buckets were returned for this range." />
  }
  const maximum = items.reduce(
    (largest, item) => Math.max(largest, item.registrations),
    0,
  )
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 2 }}>
        Bar lengths are relative within this table; exact backend counts are shown.
      </Typography>
      <TableContainer>
        <Table aria-label="Registration trend" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Backend time bucket</TableCell>
              <TableCell>Registrations</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.bucket}>
                <TableCell>{displayBucket(item.bucket)}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <Typography component="span" sx={{ fontWeight: 750 }}>
                    {formatInteger(item.registrations)}
                  </Typography>
                  <RelativeBar value={item.registrations} maximum={maximum} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

const distributionLabels: Array<{
  key: keyof LearningDistribution
  label: string
}> = [
  { key: 'inactive', label: 'Inactive' },
  { key: 'readingOnly', label: 'Reading only' },
  { key: 'vocabularyOnly', label: 'Vocabulary only' },
  { key: 'multiActivity', label: 'Multiple activities' },
]

function LearningDistributionPanel({ data }: { data: LearningDistribution }) {
  const maximum = distributionLabels.reduce(
    (largest, item) => Math.max(largest, data[item.key]),
    0,
  )
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography sx={{ fontWeight: 800 }}>Learning distribution</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        Mutually exclusive backend-defined activity groups. Bar lengths are relative within this group.
      </Typography>
      <Stack spacing={1.5}>
        {distributionLabels.map(({ key, label }) => (
          <Box key={key}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography>{label}</Typography>
              <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {formatInteger(data[key])}
              </Typography>
            </Stack>
            <RelativeBar value={data[key]} maximum={maximum} />
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}

export function AdminAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = adminAnalyticsFiltersFromSearchParams(searchParams)
  const rangeError = analyticsDateRangeError(filters)
  const enabled = !rangeError
  const overviewQuery = useAdminAnalyticsOverviewQuery(
    analyticsRequestParams(filters),
    enabled,
  )
  const contentQuery = useAdminContentAnalyticsQuery(
    contentAnalyticsRequestParams(filters),
    enabled,
  )
  const usersQuery = useAdminUserAnalyticsQuery(
    userAnalyticsRequestParams(filters),
    enabled,
  )
  const categoriesQuery = useAdminCategoryOptionsQuery()

  const updateFilters = (updates: Record<string, string | undefined>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      return next
    })
  }

  const hasFilters = Boolean(
    filters.from || filters.to || filters.categoryId || filters.status,
  )
  const content = contentQuery.data
  const users = usersQuery.data
  const contentIsEmpty = Boolean(
    content &&
      content.topArticles.length === 0 &&
      content.completionRates.length === 0 &&
      content.termSaveCounts.length === 0,
  )

  return (
    <Stack spacing={4.5}>
      <Stack spacing={1} sx={{ maxWidth: 860 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
          Analytics
        </Typography>
        <Typography color="text.secondary">
          Read aggregate learning and content signals without exposing individual learner records.
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(170px, 1fr)) auto',
              },
              gap: 1.5,
              alignItems: 'start',
            }}
          >
            <TextField
              label="From (inclusive)"
              type="date"
              value={filters.from ?? ''}
              onChange={(event) => updateFilters({ from: event.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="To (exclusive)"
              type="date"
              value={filters.to ?? ''}
              onChange={(event) => updateFilters({ to: event.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="Content category"
              value={filters.categoryId ?? ''}
              disabled={categoriesQuery.isPending}
              onChange={(event) =>
                updateFilters({ categoryId: event.target.value || undefined })
              }
            >
              <MenuItem value="">All categories</MenuItem>
              {categoriesQuery.data?.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}{category.isActive ? '' : ' · inactive'}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Account status"
              value={filters.status ?? ''}
              onChange={(event) =>
                updateFilters({ status: event.target.value || undefined })
              }
            >
              <MenuItem value="">All statuses</MenuItem>
              {USER_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status[0] + status.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </TextField>
            {hasFilters ? (
              <Button color="inherit" onClick={() => setSearchParams({})}>
                Clear
              </Button>
            ) : null}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Empty dates use the backend’s default 30-day range. Calendar dates are sent as local-midnight ISO instants; “to” is excluded.
          </Typography>
          {rangeError ? <Alert severity="error">{rangeError}</Alert> : null}
          {categoriesQuery.isError ? (
            <Alert severity="warning">
              Category options could not be loaded. Other analytics filters still work.
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      <AsyncSection
        title="Operational overview"
        description="Current stock totals and activity flows for the selected half-open range."
        isPending={overviewQuery.isPending && enabled}
        error={overviewQuery.isError ? overviewQuery.error : null}
        onRetry={() => overviewQuery.refetch()}
      >
        {!enabled ? (
          <EmptyPanel message="Fix the date range to load operational analytics." />
        ) : overviewQuery.data ? (
          <OverviewMetrics data={overviewQuery.data} />
        ) : null}
      </AsyncSection>

      <AsyncSection
        title="Content performance"
        description="Server-ranked article and vocabulary aggregates. Ranking order is preserved."
        isPending={contentQuery.isPending && enabled}
        error={contentQuery.isError ? contentQuery.error : null}
        onRetry={() => contentQuery.refetch()}
      >
        {!enabled ? (
          <EmptyPanel message="Fix the date range to load content analytics." />
        ) : contentIsEmpty ? (
          <EmptyPanel message="No content activity was returned for this range and category." />
        ) : content ? (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: 2.25, pb: 1 }}>
                <Typography sx={{ fontWeight: 800 }}>Top articles</Typography>
                <Typography variant="body2" color="text.secondary">Bounded and ranked by the backend.</Typography>
              </Box>
              {content.topArticles.length === 0 ? (
                <Box sx={{ p: 2.25 }}><Typography color="text.secondary">No ranked articles.</Typography></Box>
              ) : (
                <TableContainer>
                  <Table size="small" aria-label="Top article performance">
                    <TableHead><TableRow>
                      <TableCell>Article</TableCell><TableCell>Status</TableCell>
                      <TableCell align="right">Opened</TableCell><TableCell align="right">Completed</TableCell>
                       <TableCell align="right">Term saves</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {content.topArticles.map((article) => (
                        <TableRow key={article.articleId}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 750 }}>{article.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{article.category}</Typography>
                          </TableCell>
                          <TableCell><Chip size="small" variant="outlined" label={article.status} /></TableCell>
                          <TableCell align="right">{formatInteger(article.openedCount)}</TableCell>
                          <TableCell align="right">{formatInteger(article.completedCount)}</TableCell>
                          <TableCell align="right">{formatInteger(article.savedVocabularyCount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2.5 }}>
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 2.25, pb: 1 }}><Typography sx={{ fontWeight: 800 }}>Article completion</Typography></Box>
                {content.completionRates.length === 0 ? (
                  <Box sx={{ p: 2.25 }}><Typography color="text.secondary">No completion cohorts.</Typography></Box>
                ) : (
                  <TableContainer><Table size="small" aria-label="Article completion rates">
                    <TableHead><TableRow><TableCell>Article</TableCell><TableCell align="right">Opened</TableCell><TableCell align="right">Completed</TableCell><TableCell align="right">Rate</TableCell></TableRow></TableHead>
                    <TableBody>{content.completionRates.map((article) => (
                      <TableRow key={article.articleId}><TableCell>{article.title}</TableCell><TableCell align="right">{formatInteger(article.opened)}</TableCell><TableCell align="right">{formatInteger(article.completed)}</TableCell><TableCell align="right">{formatPercent(article.completionRate)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table></TableContainer>
                )}
              </Paper>
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 2.25, pb: 1 }}><Typography sx={{ fontWeight: 800 }}>Most-saved terms</Typography></Box>
                {content.termSaveCounts.length === 0 ? (
                  <Box sx={{ p: 2.25 }}><Typography color="text.secondary">No contextual terms were saved.</Typography></Box>
                ) : (
                  <TableContainer><Table size="small" aria-label="Contextual term save counts">
                    <TableHead><TableRow><TableCell>Term</TableCell><TableCell>Article</TableCell><TableCell align="right">Saves</TableCell></TableRow></TableHead>
                    <TableBody>{content.termSaveCounts.map((term) => (
                      <TableRow key={term.articleSentenceTermId}><TableCell><Typography sx={{ fontWeight: 750 }}>{term.value}</Typography><Typography variant="caption" color="text.secondary">{term.cefrLevel} · {term.lemma}</Typography></TableCell><TableCell>{term.articleTitle}</TableCell><TableCell align="right">{formatInteger(term.saveCount)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table></TableContainer>
                )}
              </Paper>
            </Box>
          </Stack>
        ) : null}
      </AsyncSection>

      <AsyncSection
        title="User activity"
        description="Aggregate activity only; no emails, names, or user-level rows are requested or displayed."
        isPending={usersQuery.isPending && enabled}
        error={usersQuery.isError ? usersQuery.error : null}
        onRetry={() => usersQuery.refetch()}
      >
        {!enabled ? (
          <EmptyPanel message="Fix the date range to load user analytics." />
        ) : users ? (
          <Stack spacing={2.5}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.3fr) minmax(300px, 0.7fr)' }, gap: 2.5 }}>
              <RegistrationsTrend items={users.registrationsTrend} />
              <Stack spacing={2.5}>
                <Paper variant="outlined" sx={{ p: 2.5, borderTop: 4, borderTopColor: 'secondary.main' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 750 }}>Active learners</Typography>
                  <Typography sx={{ mt: 1, fontFamily: '"Merriweather", serif', fontSize: 36, fontWeight: 700 }}>
                    {formatInteger(users.activeLearners)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Distinct learners with activity in this range.</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2.5 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography sx={{ fontWeight: 800 }}>Retention proxy</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{formatPercent(users.retentionProxy.rate)}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Equal-window activity proxy—not signup-cohort or D1/D7/D30 retention.
                  </Typography>
                  <Stack spacing={0.75} sx={{ mt: 2 }}>
                    <Typography>First window active: {formatInteger(users.retentionProxy.firstWindowActive)}</Typography>
                    <Typography>Second window active: {formatInteger(users.retentionProxy.secondWindowActive)}</Typography>
                    <Typography>Retained in both: {formatInteger(users.retentionProxy.retainedUsers)}</Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Box>
            <LearningDistributionPanel data={users.learningDistribution} />
          </Stack>
        ) : null}
      </AsyncSection>
    </Stack>
  )
}
