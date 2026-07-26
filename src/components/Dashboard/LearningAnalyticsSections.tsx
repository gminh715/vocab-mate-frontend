import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import {
  useQuizAnalyticsQuery,
  useReadingAnalyticsQuery,
  useVocabularyAnalyticsQuery,
} from '@/hooks/Analytics/useAnalytics'
import type {
  AnalyticsFilters,
  QuizAnalytics,
  ReadingAnalytics,
  ReadingTrendBucket,
  VocabularyAnalytics,
  VocabularyTrendBucket,
} from '@/types/Analytics/analytics'
import {
  analyticsDateRangeError,
  analyticsFiltersFromSearchParams,
  analyticsRequestParams,
  analyticsSearchParamsFromFilters,
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

const integerFormatter = new Intl.NumberFormat()
const bucketFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

const formatBucket = (bucket: string): string =>
  bucketFormatter.format(new Date(`${bucket}T00:00:00Z`))

const analyticsErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  return apiError.status === 400
    ? 'These analytics filters are invalid. Check the date range and try again.'
    : 'This analytics section could not be loaded. Try again.'
}

function AnalyticsFiltersPanel({
  filters,
  rangeError,
  onChange,
  onReset,
}: {
  filters: AnalyticsFilters
  rangeError: string | null
  onChange: (changes: Partial<AnalyticsFilters>) => void
  onReset: () => void
}) {
  const hasFilters = Boolean(
    filters.from ||
      filters.to ||
      filters.groupBy ||
      filters.articleId,
  )

  return (
    <Paper
      component="section"
      aria-labelledby="analytics-filter-title"
      variant="outlined"
      sx={{ p: { xs: 2, md: 2.5 } }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography
            id="analytics-filter-title"
            component="h2"
            sx={{ fontWeight: 800 }}
          >
            Analytics range
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Dates use your local timezone. The end date is exclusive; leave
            both blank for the backend&apos;s default 30-day range.
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr)) auto',
            },
            gap: 1.5,
            alignItems: 'start',
          }}
        >
          <TextField
            label="From"
            name="from"
            type="date"
            value={filters.from ?? ''}
            slotProps={{
              htmlInput: {
                autoComplete: 'off',
                'aria-describedby': rangeError
                  ? 'analytics-range-error'
                  : undefined,
              },
              inputLabel: { shrink: true },
            }}
            error={Boolean(rangeError)}
            onChange={(event) =>
              onChange({ from: event.target.value || undefined })
            }
          />
          <TextField
            label="To (exclusive)"
            name="to"
            type="date"
            value={filters.to ?? ''}
            slotProps={{
              htmlInput: {
                autoComplete: 'off',
                'aria-describedby': rangeError
                  ? 'analytics-range-error'
                  : undefined,
              },
              inputLabel: { shrink: true },
            }}
            error={Boolean(rangeError)}
            onChange={(event) =>
              onChange({ to: event.target.value || undefined })
            }
          />
          <TextField
            select
            label="Vocabulary trend interval"
            name="groupBy"
            value={filters.groupBy ?? ''}
            onChange={(event) =>
              onChange({
                groupBy:
                  (event.target.value as AnalyticsFilters['groupBy']) ||
                  undefined,
              })
            }
          >
            <MenuItem value="">Automatic</MenuItem>
            <MenuItem value="DAY">Daily</MenuItem>
            <MenuItem value="WEEK">Weekly</MenuItem>
            <MenuItem value="MONTH">Monthly</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            disabled={!hasFilters}
            onClick={onReset}
          >
            Reset filters
          </Button>
        </Box>
        {rangeError ? (
          <Typography
            id="analytics-range-error"
            role="alert"
            color="error.main"
            variant="body2"
          >
            {rangeError} Analytics requests are paused.
          </Typography>
        ) : null}
        {filters.articleId ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Typography variant="body2" color="text.secondary">
              Quiz analytics are filtered to one article:
            </Typography>
            <Chip
              label={filters.articleId}
              onDelete={() => onChange({ articleId: undefined })}
            />
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  isPending,
  isFetching,
  error,
  rangeError,
  onRetry,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  isPending: boolean
  isFetching: boolean
  error: unknown | null
  rangeError: string | null
  onRetry: () => void
  children: ReactNode
}) {
  return (
    <Paper
      component="section"
      aria-labelledby={`${id}-title`}
      variant="outlined"
      sx={{ overflow: 'hidden' }}
    >
      {isFetching && !isPending ? (
        <LinearProgress aria-label={`Refreshing ${title.toLowerCase()}`} />
      ) : (
        <Box sx={{ height: 4 }} />
      )}
      <Stack spacing={2.5} sx={{ p: { xs: 2.25, md: 3 } }}>
        <Box>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Typography>
          <Typography
            id={`${id}-title`}
            component="h2"
            variant="h2"
            sx={{
              mt: 0.5,
              scrollMarginTop: 16,
              fontSize: { xs: 28, md: 34 },
              textWrap: 'balance',
            }}
          >
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
            {description}
          </Typography>
        </Box>
        {rangeError ? (
          <Alert severity="info">
            Fix the shared date range to load this section.
          </Alert>
        ) : isPending ? (
          <Box
            role="status"
            aria-label={`Loading ${title.toLowerCase()}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {[1, 2, 3].map((key) => (
              <Skeleton
                key={key}
                variant="rounded"
                height={126}
                sx={{ borderRadius: 3 }}
              />
            ))}
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={onRetry}>
                Try again
              </Button>
            }
          >
            {analyticsErrorMessage(error)}
          </Alert>
        ) : (
          children
        )}
      </Stack>
    </Paper>
  )
}

function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string; detail: string }>
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))`,
        },
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.label}
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderTop: { xs: index === 0 ? 0 : 1, sm: 0 },
            borderLeft: { xs: 0, sm: index === 0 ? 0 : 1 },
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 750 }}>
            {item.label}
          </Typography>
          <Typography
            aria-label={`${item.label}: ${item.value}`}
            sx={{
              mt: 0.5,
              fontFamily: 'Georgia, serif',
              fontSize: 32,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {item.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.detail}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

interface DistributionItem {
  key: string
  label: string
  value: number
  valueLabel: string
  supportingLabel?: string
}

function DistributionPanel({
  title,
  summary,
  items,
  scaleMaximum,
  empty,
}: {
  title: string
  summary: string
  items: DistributionItem[]
  scaleMaximum?: number
  empty?: boolean
}) {
  const dataMaximum = items.reduce(
    (largest, item) => Math.max(largest, item.value),
    0,
  )
  const maximum = scaleMaximum ?? dataMaximum

  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
      <Typography component="h3" sx={{ fontWeight: 850 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {summary}
      </Typography>
      {empty ?? dataMaximum === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No activity was recorded for this distribution.
        </Typography>
      ) : (
        <Stack component="ul" spacing={1.5} sx={{ m: 0, mt: 2, p: 0, listStyle: 'none' }}>
          {items.map((item) => (
            <Box component="li" key={item.key}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <Typography variant="body2" sx={{ fontWeight: 750 }}>
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                >
                  {item.valueLabel}
                  {item.supportingLabel ? ` · ${item.supportingLabel}` : ''}
                </Typography>
              </Stack>
              <Box
                aria-hidden="true"
                sx={{
                  height: 7,
                  mt: 0.6,
                  overflow: 'hidden',
                  borderRadius: 99,
                  bgcolor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: `${(item.value / maximum) * 100}%`,
                    height: '100%',
                    borderRadius: 99,
                    bgcolor: 'primary.main',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

function TrendPanel({
  title,
  summary,
  headers,
  rows,
  empty,
}: {
  title: string
  summary: string
  headers: string[]
  rows: Array<{ key: string; cells: string[] }>
  empty: boolean
}) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: empty ? 2 : 1 }}>
        <Typography component="h3" sx={{ fontWeight: 850 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {summary}
        </Typography>
      </Box>
      {empty ? (
        <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>
          No activity was recorded for this trend.
        </Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader size="small" aria-label={title}>
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell key={header} align={index === 0 ? 'left' : 'right'}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.key}
                  sx={{ contentVisibility: 'auto' }}
                >
                  {row.cells.map((cell, index) => (
                    <TableCell
                      key={`${row.key}-${headers[index]}`}
                      align={index === 0 ? 'left' : 'right'}
                      sx={{ fontVariantNumeric: index === 0 ? undefined : 'tabular-nums' }}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

const chartColors = {
  saved: '#176B4B',
  savedArea: '#DDF3E8',
  opened: '#176B4B',
  completed: '#B66A2C',
  grid: '#D9E4DE',
  text: '#5D7068',
} as const

const niceCountMaximum = (value: number): number => {
  if (value <= 1) return 1

  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10

  return step * magnitude
}

function VocabularyTrendChart({
  items,
  summary,
}: {
  items: VocabularyTrendBucket[]
  summary: string
}) {
  const chart = useMemo(() => {
    const width = 720
    const height = 280
    const margin = { top: 24, right: 20, bottom: 52, left: 52 }
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom
    const maximum = niceCountMaximum(
      items.reduce(
        (largest, item) => Math.max(largest, item.count),
        0,
      ),
    )
    const xAt = (index: number) =>
      items.length === 1
        ? margin.left + plotWidth / 2
        : margin.left + (index / (items.length - 1)) * plotWidth
    const yAt = (value: number) =>
      margin.top + plotHeight - (value / maximum) * plotHeight
    const linePath = items
      .map(
        (item, index) =>
          `${index === 0 ? 'M' : 'L'} ${xAt(index).toFixed(2)} ${yAt(item.count).toFixed(2)}`,
      )
      .join(' ')
    const baseline = margin.top + plotHeight
    const areaPath =
      items.length === 0
        ? ''
        : `${linePath} L ${xAt(items.length - 1).toFixed(2)} ${baseline.toFixed(2)} L ${xAt(0).toFixed(2)} ${baseline.toFixed(2)} Z`
    const labelIndexes = Array.from(
      new Set(
        items.length <= 2
          ? items.map((_, index) => index)
          : [0, Math.floor((items.length - 1) / 2), items.length - 1],
      ),
    )

    return {
      width,
      height,
      margin,
      plotWidth,
      plotHeight,
      maximum,
      xAt,
      yAt,
      linePath,
      areaPath,
      labelIndexes,
      tickValues: Array.from(
        new Set([0, Math.ceil(maximum / 2), maximum]),
      ),
    }
  }, [items])

  const hasActivity = items.some((item) => item.count > 0)

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: hasActivity ? 1 : 2 }}>
        <Typography
          id="vocabulary-trend-title"
          component="h3"
          sx={{ fontWeight: 850 }}
        >
          Saved vocabulary trend
        </Typography>
        <Typography
          id="vocabulary-trend-summary"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {summary}
        </Typography>
      </Box>
      {hasActivity ? (
        <>
          <Stack
            direction="row"
            spacing={0.75}
            aria-label="Saved vocabulary trend legend"
            sx={{ px: 2, py: 1, alignItems: 'center' }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 20,
                height: 3,
                borderRadius: 99,
                bgcolor: chartColors.saved,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Vocabulary saved
            </Typography>
          </Stack>
          <Box sx={{ overflowX: 'auto', px: 1, pb: 1.5 }}>
            <Box
              component="svg"
              role="img"
              aria-labelledby="vocabulary-trend-title vocabulary-trend-summary"
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              preserveAspectRatio="xMidYMid meet"
              sx={{
                display: 'block',
                width: '100%',
                minWidth: 560,
                height: 'auto',
              }}
            >
              {chart.tickValues.map((value) => {
                const y = chart.yAt(value)

                return (
                  <g key={value}>
                    <line
                      x1={chart.margin.left}
                      x2={chart.margin.left + chart.plotWidth}
                      y1={y}
                      y2={y}
                      stroke={chartColors.grid}
                      strokeWidth="1"
                    />
                    <text
                      x={chart.margin.left - 10}
                      y={y + 4}
                      fill={chartColors.text}
                      fontSize="12"
                      textAnchor="end"
                    >
                      {integerFormatter.format(value)}
                    </text>
                  </g>
                )
              })}
              <text
                x="14"
                y={chart.margin.top + chart.plotHeight / 2}
                fill={chartColors.text}
                fontSize="12"
                textAnchor="middle"
                transform={`rotate(-90 14 ${chart.margin.top + chart.plotHeight / 2})`}
              >
                Words saved
              </text>
              {chart.labelIndexes.map((index) => (
                <text
                  key={items[index]!.bucket}
                  x={chart.xAt(index)}
                  y={chart.height - 18}
                  fill={chartColors.text}
                  fontSize="12"
                  textAnchor={
                    index === 0
                      ? 'start'
                      : index === items.length - 1
                        ? 'end'
                        : 'middle'
                  }
                >
                  {formatBucket(items[index]!.bucket)}
                </text>
              ))}
              <path d={chart.areaPath} fill={chartColors.savedArea} />
              <path
                d={chart.linePath}
                fill="none"
                stroke={chartColors.saved}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {items.length <= 60
                ? items.map((item, index) => (
                    <circle
                      key={item.bucket}
                      cx={chart.xAt(index)}
                      cy={chart.yAt(item.count)}
                      r="3.5"
                      fill={chartColors.saved}
                    >
                      <title>
                        {`${formatBucket(item.bucket)}: ${integerFormatter.format(item.count)} saved`}
                      </title>
                    </circle>
                  ))
                : null}
            </Box>
          </Box>
        </>
      ) : (
        <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>
          No saved vocabulary activity was recorded for this trend.
        </Typography>
      )}
    </Paper>
  )
}

function ReadingTrendChart({
  items,
  summary,
}: {
  items: ReadingTrendBucket[]
  summary: string
}) {
  const chart = useMemo(() => {
    const width = 720
    const height = 280
    const margin = { top: 24, right: 20, bottom: 52, left: 52 }
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom
    const maximum = niceCountMaximum(
      items.reduce(
        (largest, item) =>
          Math.max(largest, item.opened, item.completed),
        0,
      ),
    )
    const xAt = (index: number) =>
      items.length === 1
        ? margin.left + plotWidth / 2
        : margin.left + (index / (items.length - 1)) * plotWidth
    const yAt = (value: number) =>
      margin.top + plotHeight - (value / maximum) * plotHeight
    const pathFor = (field: 'opened' | 'completed') =>
      items
        .map(
          (item, index) =>
            `${index === 0 ? 'M' : 'L'} ${xAt(index).toFixed(2)} ${yAt(item[field]).toFixed(2)}`,
        )
        .join(' ')
    const labelIndexes = Array.from(
      new Set(
        items.length <= 2
          ? items.map((_, index) => index)
          : [0, Math.floor((items.length - 1) / 2), items.length - 1],
      ),
    )

    return {
      width,
      height,
      margin,
      plotWidth,
      plotHeight,
      maximum,
      xAt,
      yAt,
      openedPath: pathFor('opened'),
      completedPath: pathFor('completed'),
      labelIndexes,
      tickValues: Array.from(
        new Set([0, Math.ceil(maximum / 2), maximum]),
      ),
    }
  }, [items])

  const hasActivity = items.some(
    (item) => item.opened > 0 || item.completed > 0,
  )

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: hasActivity ? 1 : 2 }}>
        <Typography id="reading-trend-title" component="h3" sx={{ fontWeight: 850 }}>
          Reading activity trend
        </Typography>
        <Typography
          id="reading-trend-summary"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {summary}
        </Typography>
      </Box>
      {hasActivity ? (
        <>
          <Stack
            direction="row"
            spacing={2}
            aria-label="Reading activity legend"
            sx={{ px: 2, py: 1, flexWrap: 'wrap' }}
          >
            {[
              { label: 'Opened', color: chartColors.opened },
              { label: 'Completed', color: chartColors.completed },
            ].map((item) => (
              <Stack
                key={item.label}
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center' }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 20,
                    height: 3,
                    borderRadius: 99,
                    bgcolor: item.color,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Box sx={{ overflowX: 'auto', px: 1, pb: 1.5 }}>
            <Box
              component="svg"
              role="img"
              aria-labelledby="reading-trend-title reading-trend-summary"
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              preserveAspectRatio="xMidYMid meet"
              sx={{
                display: 'block',
                width: '100%',
                minWidth: 560,
                height: 'auto',
              }}
            >
              {chart.tickValues.map((value) => {
                const y = chart.yAt(value)

                return (
                  <g key={value}>
                    <line
                      x1={chart.margin.left}
                      x2={chart.margin.left + chart.plotWidth}
                      y1={y}
                      y2={y}
                      stroke={chartColors.grid}
                      strokeWidth="1"
                    />
                    <text
                      x={chart.margin.left - 10}
                      y={y + 4}
                      fill={chartColors.text}
                      fontSize="12"
                      textAnchor="end"
                    >
                      {integerFormatter.format(value)}
                    </text>
                  </g>
                )
              })}
              <text
                x="14"
                y={chart.margin.top + chart.plotHeight / 2}
                fill={chartColors.text}
                fontSize="12"
                textAnchor="middle"
                transform={`rotate(-90 14 ${chart.margin.top + chart.plotHeight / 2})`}
              >
                Articles
              </text>
              {chart.labelIndexes.map((index) => (
                <text
                  key={items[index]!.bucket}
                  x={chart.xAt(index)}
                  y={chart.height - 18}
                  fill={chartColors.text}
                  fontSize="12"
                  textAnchor={
                    index === 0
                      ? 'start'
                      : index === items.length - 1
                        ? 'end'
                        : 'middle'
                  }
                >
                  {formatBucket(items[index]!.bucket)}
                </text>
              ))}
              <path
                d={chart.openedPath}
                fill="none"
                stroke={chartColors.opened}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <path
                d={chart.completedPath}
                fill="none"
                stroke={chartColors.completed}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {items.length <= 60
                ? items.flatMap((item, index) => [
                    <circle
                      key={`${item.bucket}-opened`}
                      cx={chart.xAt(index)}
                      cy={chart.yAt(item.opened)}
                      r="3.5"
                      fill={chartColors.opened}
                    >
                      <title>
                        {`${formatBucket(item.bucket)}: ${integerFormatter.format(item.opened)} opened`}
                      </title>
                    </circle>,
                    <circle
                      key={`${item.bucket}-completed`}
                      cx={chart.xAt(index)}
                      cy={chart.yAt(item.completed)}
                      r="3.5"
                      fill={chartColors.completed}
                    >
                      <title>
                        {`${formatBucket(item.bucket)}: ${integerFormatter.format(item.completed)} completed`}
                      </title>
                    </circle>,
                  ])
                : null}
            </Box>
          </Box>
        </>
      ) : (
        <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>
          No activity was recorded for this trend.
        </Typography>
      )}
    </Paper>
  )
}

function VocabularyAnalyticsContent({
  data,
}: {
  data: VocabularyAnalytics
}) {
  const statusSummary = data.byStatus
    .map((item) => `${learningStatusLabel(item.status)} ${integerFormatter.format(item.count)}`)
    .join(', ')
  const cefrSummary = data.byCefr
    .map((item) => `${cefrLevelLabel(item.cefrLevel)} ${integerFormatter.format(item.count)}`)
    .join(', ')
  const trendTotal = data.savedTrend.reduce(
    (total, item) => total + item.count,
    0,
  )

  return (
    <Stack spacing={2}>
      <MetricStrip
        items={[
          {
            label: 'Total saved',
            value: integerFormatter.format(data.totals.total),
            detail: 'Current vocabulary stock',
          },
          {
            label: 'Due now',
            value: integerFormatter.format(data.totals.due),
            detail: 'Current review schedule',
          },
          {
            label: 'Mastered',
            value: integerFormatter.format(data.totals.mastered),
            detail: 'Current mastered stock',
          },
        ]}
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <DistributionPanel
          title="Learning status"
          summary={`Status totals: ${statusSummary}.`}
          items={data.byStatus.map((item) => ({
            key: item.status,
            label: learningStatusLabel(item.status),
            value: item.count,
            valueLabel: integerFormatter.format(item.count),
          }))}
        />
        <DistributionPanel
          title="CEFR distribution"
          summary={`Saved vocabulary by level: ${cefrSummary}.`}
          items={data.byCefr.map((item) => ({
            key: item.cefrLevel,
            label: cefrLevelLabel(item.cefrLevel),
            value: item.count,
            valueLabel: integerFormatter.format(item.count),
          }))}
        />
      </Box>
      <VocabularyTrendChart
        items={data.savedTrend}
        summary={`${integerFormatter.format(trendTotal)} vocabulary saves across ${integerFormatter.format(data.savedTrend.length)} time buckets. Backend bucket order is preserved.`}
      />
    </Stack>
  )
}

function ReadingAnalyticsContent({ data }: { data: ReadingAnalytics }) {
  const categorySummary = data.byCategory
    .map(
      (item) =>
        `${item.categoryName}: ${integerFormatter.format(item.completed)} of ${integerFormatter.format(item.opened)} completed`,
    )
    .join('; ')
  return (
    <Stack spacing={2}>
      <MetricStrip
        items={[
          {
            label: 'Articles opened',
            value: integerFormatter.format(data.opened),
            detail: 'Opened in this cohort',
          },
          {
            label: 'Articles completed',
            value: integerFormatter.format(data.completed),
            detail: 'Completed cohort records',
          },
          {
            label: 'Completion rate',
            value: formatAnalyticsRatio(data.completionRate),
            detail: data.opened === 0 ? 'No opened articles' : 'Completed ÷ opened',
          },
        ]}
      />
      <DistributionPanel
        title="Reading by category"
        summary={
          categorySummary
            ? `Category summary: ${categorySummary}. Archived article history remains included.`
            : 'No category activity was returned. Archived article history remains eligible.'
        }
        items={data.byCategory.map((item) => ({
          key: item.categoryId,
          label: item.categoryName,
          value: item.opened,
          valueLabel: `${integerFormatter.format(item.completed)} / ${integerFormatter.format(item.opened)}`,
          supportingLabel: formatAnalyticsRatio(item.completionRate),
        }))}
      />
      <ReadingTrendChart
        items={data.trend}
        summary={`${integerFormatter.format(data.opened)} opened and ${integerFormatter.format(data.completed)} completed articles across ${integerFormatter.format(data.trend.length)} time buckets.`}
      />
    </Stack>
  )
}

function QuizAnalyticsContent({ data }: { data: QuizAnalytics }) {
  const questionSummary = data.byQuestionType
    .map(
      (item) =>
        `${questionTypeLabel(item.questionType)} ${formatAnalyticsRatio(item.accuracy)} from ${integerFormatter.format(item.answers)} answers`,
    )
    .join('; ')
  const trendSessions = data.trend.reduce(
    (total, item) => total + item.sessions,
    0,
  )

  return (
    <Stack spacing={2}>
      <MetricStrip
        items={[
          {
            label: 'Completed sessions',
            value: integerFormatter.format(data.sessions),
            detail: 'In-progress and abandoned excluded',
          },
          {
            label: 'Accuracy',
            value: formatAnalyticsRatio(data.accuracy),
            detail: 'Correct answers ÷ total answers',
          },
          {
            label: 'Average score',
            value: formatAnalyticsRatio(data.averageScore),
            detail: 'Normalized completed-session score',
          },
        ]}
      />
      <DistributionPanel
        title="Performance by question type"
        summary={`Question-type performance: ${questionSummary}. Only answers from completed sessions are included.`}
        scaleMaximum={1}
        empty={data.byQuestionType.every((item) => item.answers === 0)}
        items={data.byQuestionType.map((item) => ({
          key: item.questionType,
          label: questionTypeLabel(item.questionType),
          value: item.accuracy,
          valueLabel: `${integerFormatter.format(item.correctAnswers)} / ${integerFormatter.format(item.answers)}`,
          supportingLabel: formatAnalyticsRatio(item.accuracy),
        }))}
      />
      <TrendPanel
        title="Quiz performance trend"
        summary={`${integerFormatter.format(data.sessions)} completed sessions across ${integerFormatter.format(data.trend.length)} time buckets. Accuracy and score are backend-calculated ratios.`}
        headers={['Period', 'Sessions', 'Accuracy', 'Average score']}
        rows={data.trend.map((item) => ({
          key: item.bucket,
          cells: [
            formatBucket(item.bucket),
            integerFormatter.format(item.sessions),
            formatAnalyticsRatio(item.accuracy),
            formatAnalyticsRatio(item.averageScore),
          ],
        }))}
        empty={trendSessions === 0}
      />
    </Stack>
  )
}

export function LearningAnalyticsSections() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()
  const filters = useMemo(
    () => analyticsFiltersFromSearchParams(new URLSearchParams(searchString)),
    [searchString],
  )
  const rangeError = analyticsDateRangeError(filters)
  const enabled = rangeError === null
  const dateParams = useMemo(
    () => analyticsRequestParams(filters),
    [filters],
  )
  const vocabularyParams = useMemo(
    () => vocabularyAnalyticsRequestParams(filters),
    [filters],
  )
  const quizParams = useMemo(
    () => quizAnalyticsRequestParams(filters),
    [filters],
  )
  const vocabularyQuery = useVocabularyAnalyticsQuery(
    vocabularyParams,
    enabled,
  )
  const readingQuery = useReadingAnalyticsQuery(dateParams, enabled)
  const quizQuery = useQuizAnalyticsQuery(quizParams, enabled)

  useEffect(() => {
    const normalized = normalizeAnalyticsSearchParams(
      new URLSearchParams(searchString),
    )

    if (normalized.toString() !== searchString) {
      setSearchParams(normalized, { replace: true })
    }
  }, [searchString, setSearchParams])

  const updateFilters = (changes: Partial<AnalyticsFilters>) => {
    setSearchParams(
      analyticsSearchParamsFromFilters({ ...filters, ...changes }),
    )
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography
          sx={{
            color: 'primary.main',
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
          }}
        >
          Detailed analytics
        </Typography>
        <Typography
          component="h2"
          variant="h2"
          sx={{
            mt: 0.75,
            fontSize: { xs: 32, md: 40 },
            textWrap: 'balance',
          }}
        >
          See how your learning is taking shape
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 740 }}>
          Each section comes directly from its learner analytics endpoint and
          can load or recover independently.
        </Typography>
      </Box>

      <AnalyticsFiltersPanel
        filters={filters}
        rangeError={rangeError}
        onChange={updateFilters}
        onReset={() => setSearchParams(new URLSearchParams())}
      />

      <SectionShell
        id="vocabulary-analytics"
        eyebrow="Vocabulary"
        title="Vocabulary growth"
        description="Current vocabulary stock and save activity during the selected range."
        isPending={vocabularyQuery.isPending}
        isFetching={vocabularyQuery.isFetching}
        error={vocabularyQuery.isError ? vocabularyQuery.error : null}
        rangeError={rangeError}
        onRetry={() => void vocabularyQuery.refetch()}
      >
        {vocabularyQuery.data ? (
          <VocabularyAnalyticsContent data={vocabularyQuery.data} />
        ) : null}
      </SectionShell>

      <SectionShell
        id="reading-analytics"
        eyebrow="Reading"
        title="Reading momentum"
        description="Opened-article cohorts, completion, categories, and activity over time."
        isPending={readingQuery.isPending}
        isFetching={readingQuery.isFetching}
        error={readingQuery.isError ? readingQuery.error : null}
        rangeError={rangeError}
        onRetry={() => void readingQuery.refetch()}
      >
        {readingQuery.data ? (
          <ReadingAnalyticsContent data={readingQuery.data} />
        ) : null}
      </SectionShell>

      <SectionShell
        id="quiz-analytics"
        eyebrow="Quizzes"
        title="Quiz performance"
        description="Backend-scored performance from completed review sessions only."
        isPending={quizQuery.isPending}
        isFetching={quizQuery.isFetching}
        error={quizQuery.isError ? quizQuery.error : null}
        rangeError={rangeError}
        onRetry={() => void quizQuery.refetch()}
      >
        {quizQuery.data ? <QuizAnalyticsContent data={quizQuery.data} /> : null}
      </SectionShell>
    </Stack>
  )
}
