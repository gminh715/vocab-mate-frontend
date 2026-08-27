import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { SkillBreakdown } from '@/components/Review/SkillBreakdown'
import {
  useReadingAnalyticsQuery,
  useReviewAnalyticsQuery,
  useVocabularyAnalyticsQuery,
} from '@/hooks/Analytics/useAnalytics'
import { ANALYTICS_SECTIONS } from '@/types/Analytics/analytics'
import type {
  AnalyticsFilters,
  ReadingAnalytics,
  ReadingTrendBucket,
  ReviewAnalytics,
  VocabularyAnalytics,
  VocabularyTrendBucket,
} from '@/types/Analytics/analytics'
import {
  analyticsDateRangeError,
  analyticsFiltersFromSearchParams,
  analyticsRequestParams,
  analyticsSearchParamsFromFilters,
  normalizeAnalyticsSearchParams,
  vocabularyAnalyticsRequestParams,
} from '@/utils/Analytics/analyticsParams'
import {
  cefrLevelLabel,
  formatAnalyticsRatio,
  learningStatusLabel,
} from '@/utils/Analytics/analyticsPresentation'
import {
  BookOpenIcon,
  BookmarkIcon,
  FilterIcon,
  SparklesIcon,
} from './DashboardIcons'

const integerFormatter = new Intl.NumberFormat()
const bucketFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

const formatBucket = (bucket: string): string =>
  bucketFormatter.format(new Date(`${bucket}T00:00:00Z`))

const analyticsErrorMessage = (error: unknown, t: (key: string) => string): string => {
  const apiError = normalizeApiError(error)

  return apiError.status === 400
    ? t('errors.invalidFilters')
    : t('errors.loadError')
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
  const { t } = useTranslation('analytics')
  const [showCustom, setShowCustom] = useState(Boolean(filters.from || filters.to || filters.groupBy))

  const hasFilters = Boolean(
    filters.from ||
      filters.to ||
      filters.groupBy,
  )

  const handlePreset = (days: number | null) => {
    if (days === null) {
      onChange({ from: undefined, to: undefined })
      return
    }
    const today = new Date()
    const past = new Date()
    past.setDate(today.getDate() - days)
    onChange({
      from: past.toISOString().split('T')[0],
      to: undefined,
    })
  }

  const isDefault30 = !filters.from && !filters.to

  return (
    <Paper
      component="section"
      aria-labelledby="analytics-filter-title"
      variant="outlined"
      sx={{ px: { xs: 2, md: 2.25 }, py: 1.5, borderRadius: 3 }}
    >
      <Stack spacing={showCustom ? 1.5 : 0}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography
              id="analytics-filter-title"
              sx={{ fontWeight: 700, fontSize: 14, mr: 1 }}
            >
              {t('filters.timePeriod')}
            </Typography>
            <Chip
              label={t('filters.default30')}
              size="small"
              color={isDefault30 ? 'primary' : 'default'}
              variant={isDefault30 ? 'filled' : 'outlined'}
              onClick={() => handlePreset(null)}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
            <Chip
              label={t('filters.days7')}
              size="small"
              color={filters.from && !filters.to ? 'primary' : 'default'}
              variant={filters.from && !filters.to ? 'filled' : 'outlined'}
              onClick={() => handlePreset(7)}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
            <Chip
              label={t('filters.days90')}
              size="small"
              variant="outlined"
              onClick={() => handlePreset(90)}
              sx={{ fontWeight: 600, cursor: 'pointer' }}
            />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              size="small"
              variant={showCustom ? 'contained' : 'outlined'}
              startIcon={<FilterIcon size={16} />}
              onClick={() => setShowCustom((prev) => !prev)}
              sx={{ height: 32, borderRadius: 2, textTransform: 'none' }}
            >
              {showCustom ? t('filters.hideCustomDates') : t('filters.customDates')}
            </Button>
            {hasFilters ? (
              <Button
                size="small"
                color="inherit"
                onClick={onReset}
                sx={{ height: 32, textTransform: 'none' }}
              >
                {t('filters.reset')}
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <Collapse in={showCustom}>
          <Box
            sx={{
              pt: 1.5,
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
              label={t('filters.from')}
              name="from"
              type="date"
              size="small"
              value={filters.from ?? ''}
              slotProps={{
                htmlInput: {
                  autoComplete: 'off',
                  'aria-describedby': rangeError ? 'analytics-range-error' : undefined,
                },
                inputLabel: { shrink: true },
              }}
              error={Boolean(rangeError)}
              onChange={(event) =>
                onChange({ from: event.target.value || undefined })
              }
            />
            <TextField
              label={t('filters.to')}
              name="to"
              type="date"
              size="small"
              value={filters.to ?? ''}
              slotProps={{
                htmlInput: {
                  autoComplete: 'off',
                  'aria-describedby': rangeError ? 'analytics-range-error' : undefined,
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
              label={t('filters.interval')}
              name="groupBy"
              size="small"
              value={filters.groupBy ?? ''}
              onChange={(event) =>
                onChange({
                  groupBy:
                    (event.target.value as AnalyticsFilters['groupBy']) ||
                    undefined,
                })
              }
            >
              <MenuItem value="">{t('filters.automatic')}</MenuItem>
              <MenuItem value="DAY">{t('filters.daily')}</MenuItem>
              <MenuItem value="WEEK">{t('filters.weekly')}</MenuItem>
              <MenuItem value="MONTH">{t('filters.monthly')}</MenuItem>
            </TextField>
          </Box>
        </Collapse>

        {rangeError ? (
          <Typography
            id="analytics-range-error"
            role="alert"
            color="error.main"
            variant="body2"
          >
            {rangeError} {t('filters.rangeErrorSuffix')}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  )
}

function SectionShell({
  id,
  title,
  refreshingLabel,
  loadingLabel,
  isPending,
  isFetching,
  error,
  rangeError,
  tabPanelId,
  tabLabelledBy,
  onRetry,
  children,
}: {
  id: string
  title: string
  description?: string
  refreshingLabel: string
  loadingLabel: string
  isPending: boolean
  isFetching: boolean
  error: unknown | null
  rangeError: string | null
  tabPanelId?: string
  tabLabelledBy?: string
  onRetry: () => void
  children: ReactNode
}) {
  const { t } = useTranslation('analytics')

  return (
    <Paper
      id={tabPanelId}
      role={tabPanelId ? 'tabpanel' : undefined}
      component="section"
      aria-labelledby={tabLabelledBy ?? `${id}-title`}
      variant="outlined"
      sx={{ overflow: 'hidden' }}
    >
      {isFetching && !isPending ? (
        <LinearProgress aria-label={refreshingLabel} />
      ) : (
        <Box sx={{ height: 4 }} />
      )}
      <Stack spacing={2.5} sx={{ p: { xs: 2.25, md: 3 } }}>
        <Box>
          <Typography
            id={`${id}-title`}
            component="h2"
            variant="h2"
            sx={{
              scrollMarginTop: 16,
              fontSize: { xs: 28, md: 34 },
              textWrap: 'balance',
            }}
          >
            {title}
          </Typography>
        </Box>
        {rangeError ? (
          <Alert severity="info">
            {t('errors.fixDateRange')}
          </Alert>
        ) : isPending ? (
          <Box
            role="status"
            aria-label={loadingLabel}
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
                {t('errors.tryAgain')}
              </Button>
            }
          >
            {analyticsErrorMessage(error, t)}
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
  items: Array<{ label: string; value: string; detail?: string }>
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
              fontFamily: '"Merriweather", serif',
              fontSize: 32,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {item.value}
          </Typography>
          {item.detail ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              {item.detail}
            </Typography>
          ) : null}
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

const distributionColors = ['#176B4B', '#B66A2C', '#4B6B9C', '#8A5A98', '#B48A1E'] as const

const pointOnCircle = (center: number, radius: number, angle: number) => ({
  x: center + radius * Math.cos(angle),
  y: center + radius * Math.sin(angle),
})

const pieSlicePath = (
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = pointOnCircle(center, radius, startAngle)
  const end = pointOnCircle(center, radius, endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

  return [
    `M ${center} ${center}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function PieDistribution({ items, title }: { items: DistributionItem[]; title: string }) {
  const coloredItems = items.map((item, index) => ({
    ...item,
    color: distributionColors[index % distributionColors.length],
  }))
  const visibleItems = coloredItems.filter((item) => item.value > 0)
  const total = visibleItems.reduce((sum, item) => sum + item.value, 0)

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
      <Box
        component="svg"
        role="img"
        aria-label={title}
        viewBox="0 0 180 180"
        sx={{ width: 180, height: 180, flex: '0 0 auto' }}
      >
        {visibleItems.map((item, index) => {
          const sliceAngle = (item.value / total) * Math.PI * 2
          const precedingValue = visibleItems
            .slice(0, index)
            .reduce((sum, precedingItem) => sum + precedingItem.value, 0)
          const startAngle = -Math.PI / 2 + (precedingValue / total) * Math.PI * 2
          const endAngle = startAngle + sliceAngle

          return sliceAngle === Math.PI * 2 ? (
            <circle key={item.key} cx="90" cy="90" r="82" fill={item.color}>
              <title>{`${item.label}: ${item.valueLabel}`}</title>
            </circle>
          ) : (
            <path
              key={item.key}
              d={pieSlicePath(90, 82, startAngle, endAngle)}
              fill={item.color}
            >
              <title>{`${item.label}: ${item.valueLabel}`}</title>
            </path>
          )
        })}
      </Box>
      <Stack
        component="ul"
        aria-label={`${title} legend`}
        spacing={1}
        sx={{ m: 0, p: 0, width: '100%', listStyle: 'none' }}
      >
        {coloredItems.map((item) => (
          <Stack
            component="li"
            key={item.key}
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 10,
                  height: 10,
                  flex: '0 0 auto',
                  borderRadius: '50%',
                  bgcolor: item.color,
                }}
              />
              <Typography variant="body2" noWrap sx={{ fontWeight: 750 }}>
                {item.label}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {item.valueLabel}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

function DistributionPanel({
  title,
  summary,
  items,
  scaleMaximum,
  empty,
  emptyMessage,
  variant = 'bars',
}: {
  title: string
  summary?: string
  items: DistributionItem[]
  scaleMaximum?: number
  empty?: boolean
  emptyMessage?: string
  variant?: 'bars' | 'pie'
}) {
  const { t } = useTranslation('analytics')
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
      {summary ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {summary}
        </Typography>
      ) : null}
      {empty ?? dataMaximum === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {emptyMessage ?? t('vocabulary.noDistributionActivity')}
        </Typography>
      ) : variant === 'pie' ? (
        <PieDistribution items={items} title={title} />
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
  emptyMessage,
}: {
  title: string
  summary?: string
  headers: string[]
  rows: Array<{ key: string; cells: string[] }>
  empty: boolean
  emptyMessage?: string
}) {
  const { t } = useTranslation('analytics')

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: empty ? 2 : 1 }}>
        <Typography component="h3" sx={{ fontWeight: 850 }}>
          {title}
        </Typography>
        {summary ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {summary}
          </Typography>
        ) : null}
      </Box>
      {empty ? (
        <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>
          {emptyMessage ?? t('review.noTrendEvidence')}
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
}: {
  items: VocabularyTrendBucket[]
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

  const { t } = useTranslation('analytics')

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: hasActivity ? 1 : 2 }}>
        <Typography
          id="vocabulary-trend-title"
          component="h3"
          sx={{ fontWeight: 850 }}
        >
          {t('vocabulary.savedTrend')}
        </Typography>
      </Box>
      {hasActivity ? (
        <>
          <Stack
            direction="row"
            spacing={0.75}
            aria-label={t('vocabulary.savedTrendLegend')}
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
              {t('vocabulary.vocabularySaved')}
            </Typography>
          </Stack>
          <Box sx={{ overflowX: 'auto', px: 1, pb: 1.5 }}>
            <Box
              component="svg"
              role="img"
              aria-labelledby="vocabulary-trend-title"
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
                {t('vocabulary.wordsSaved')}
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
          {t('vocabulary.noTrendActivity')}
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
  summary?: string
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

  const { t } = useTranslation('analytics')

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: hasActivity ? 1 : 2 }}>
        <Typography id="reading-trend-title" component="h3" sx={{ fontWeight: 850 }}>
          {t('reading.readingActivityTrend')}
        </Typography>
      </Box>
      {hasActivity ? (
        <>
          <Stack
            direction="row"
            spacing={2}
            aria-label={t('reading.readingActivityLegend')}
            sx={{ px: 2, py: 1, flexWrap: 'wrap' }}
          >
            {[
              { label: t('reading.opened'), color: chartColors.opened },
              { label: t('reading.completed'), color: chartColors.completed },
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
              aria-label={
                summary
                  ? `${t('reading.readingActivityTrend')} ${summary}`
                  : undefined
              }
              aria-labelledby={summary ? undefined : 'reading-trend-title'}
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
                {t('reading.articles')}
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
          {t('reading.noTrendActivity')}
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
  const { t } = useTranslation('analytics')
  return (
    <Stack spacing={2}>
      <MetricStrip
        items={[
          {
            label: t('vocabulary.totalSaved'),
            value: integerFormatter.format(data.totals.total),
            detail: t('vocabulary.totalSavedDetail'),
          },
          {
            label: t('vocabulary.dueNow'),
            value: integerFormatter.format(data.totals.due),
            detail: t('vocabulary.dueNowDetail'),
          },
          {
            label: t('vocabulary.mastered'),
            value: integerFormatter.format(data.totals.mastered),
            detail: t('vocabulary.masteredDetail'),
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
          title={t('vocabulary.learningStatus')}
          emptyMessage={t('vocabulary.noDistributionActivity')}
          variant="pie"
          items={data.byStatus.map((item) => ({
            key: item.status,
            label: learningStatusLabel(item.status),
            value: item.count,
            valueLabel: integerFormatter.format(item.count),
          }))}
        />
        <DistributionPanel
          title={t('vocabulary.cefrDistribution')}
          emptyMessage={t('vocabulary.noDistributionActivity')}
          variant="pie"
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
      />
    </Stack>
  )
}

function ReadingAnalyticsContent({ data }: { data: ReadingAnalytics }) {
  const { t } = useTranslation('analytics')
  return (
    <Stack spacing={2}>
      <MetricStrip
        items={[
          {
            label: t('reading.articlesOpened'),
            value: integerFormatter.format(data.opened),
          },
          {
            label: t('reading.articlesCompleted'),
            value: integerFormatter.format(data.completed),
          },
          {
            label: t('reading.completionRate'),
            value: formatAnalyticsRatio(data.completionRate),
          },
        ]}
      />
      <DistributionPanel
        title={t('reading.byCategory')}
        emptyMessage={t('reading.noTrendActivity')}
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

function ReviewAnalyticsContent({ data }: { data: ReviewAnalytics }) {
  const { t } = useTranslation('analytics')
  const formatResponseTime = (milliseconds: number | null) =>
    milliseconds === null
      ? '—'
      : t('review.seconds', {
          count: Math.round((milliseconds / 1000) * 10) / 10,
        })
  const interventionCount = data.byDecisionSource.reduce(
    (total, item) => total + item.interventions,
    0,
  )
  const retentionFollowUps =
    data.retention.nextDay.followUps + data.retention.sevenDay.followUps

  return (
    <Stack spacing={2}>
      <MetricStrip
        items={[
          {
            label: t('review.completedSessions'),
            value: integerFormatter.format(data.sessionsCompleted),
            detail: t('review.completedSessionsDetail', {
              count: data.sessionsStarted,
            }),
          },
          {
            label: t('review.answerAccuracy'),
            value: formatAnalyticsRatio(data.accuracy),
            detail: t('review.answerAccuracyDetail'),
          },
          {
            label: t('review.retestSuccess'),
            value: formatAnalyticsRatio(data.sameSessionRetest.successRate),
            detail: t('review.retestSuccessDetail'),
          },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' },
          gap: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography id="review-skill-analytics-title" component="h3" sx={{ fontWeight: 850 }}>
            {t('review.bySkill')}
          </Typography>
          {data.bySkill.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <SkillBreakdown items={data.bySkill} labelledBy="review-skill-analytics-title" />
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              {t('review.noSkillEvidence')}
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography component="h3" sx={{ fontWeight: 850 }}>
            {t('review.practiceSignals')}
          </Typography>
          <Stack spacing={1.75} sx={{ mt: 2 }}>
            {[
              [t('review.averageResponse'), formatResponseTime(data.averageResponseTimeMs)],
              [t('review.hintsUsed'), integerFormatter.format(data.hintsUsed)],
              [t('review.sessionsEnded'), integerFormatter.format(data.sessionsAbandoned)],
            ].map(([label, value]) => (
              <Stack key={label} direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Typography color="text.secondary" variant="body2">{label}</Typography>
                <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <DistributionPanel
          title={t('review.byDuration')}
          scaleMaximum={1}
          empty={data.byDuration.every((item) => item.started === 0)}
          emptyMessage={t('review.noDurationEvidence')}
          items={data.byDuration.map((item) => ({
            key: String(item.targetDurationMinutes),
            label: t('review.durationLabel', { count: item.targetDurationMinutes }),
            value: item.completionRate,
            valueLabel: `${integerFormatter.format(item.completed)} / ${integerFormatter.format(item.started)}`,
            supportingLabel: formatAnalyticsRatio(item.completionRate),
          }))}
        />
        <DistributionPanel
          title={t('review.interventionOutcomes')}
          summary={
            interventionCount === 0
              ? t('review.noInterventionEvidence')
              : t('review.interventionEvidence', {
                  count: interventionCount,
                })
          }
          scaleMaximum={1}
          empty={false}
          items={data.byDecisionSource.map((item) => ({
            key: item.source,
            label: t(`review.sources.${item.source}`),
            value: item.retestSuccessRate,
            valueLabel: `${integerFormatter.format(item.successfulRetests)} / ${integerFormatter.format(item.retestAttempts)}`,
            supportingLabel: t('review.interventionSourceEvidence', {
              count: item.interventions,
              rate:
                item.retestAttempts === 0
                  ? '—'
                  : formatAnalyticsRatio(item.retestSuccessRate),
            }),
          }))}
        />
      </Box>

      <TrendPanel
        title={t('review.retentionTitle')}
        summary={
          retentionFollowUps === 0
            ? t('review.noRetentionEvidence')
            : t('review.retentionEvidence', {
                count: retentionFollowUps,
              })
        }
        headers={[
          t('review.retentionWindow'),
          t('review.followUps'),
          t('review.correctFollowUps'),
          t('review.retentionAccuracy'),
        ]}
        rows={[
          { key: 'next-day', label: t('review.nextDay'), value: data.retention.nextDay },
          { key: 'seven-day', label: t('review.sevenDay'), value: data.retention.sevenDay },
        ].map((item) => ({
          key: item.key,
          cells: [
            item.label,
            integerFormatter.format(item.value.followUps),
            integerFormatter.format(item.value.correct),
            item.value.followUps === 0
              ? '—'
              : formatAnalyticsRatio(item.value.accuracy),
          ],
        }))}
        empty={false}
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
  const activeTab = ANALYTICS_SECTIONS.indexOf(
    filters.section ?? 'vocabulary',
  )
  const enabled = rangeError === null
  const dateParams = useMemo(
    () => analyticsRequestParams(filters),
    [filters],
  )
  const vocabularyParams = useMemo(
    () => vocabularyAnalyticsRequestParams(filters),
    [filters],
  )
  const vocabularyQuery = useVocabularyAnalyticsQuery(
    vocabularyParams,
    enabled,
  )
  const readingQuery = useReadingAnalyticsQuery(dateParams, enabled)
  const reviewQuery = useReviewAnalyticsQuery(dateParams, enabled)

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

  const { t } = useTranslation('analytics')

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          id="analytics-title"
          component="h2"
          variant="h2"
          sx={{
            fontSize: { xs: 22, sm: 24 },
            fontWeight: 700,
          }}
        >
          {t('title')}
        </Typography>
      </Box>

      <AnalyticsFiltersPanel
        filters={filters}
        rangeError={rangeError}
        onChange={updateFilters}
        onReset={() => setSearchParams(new URLSearchParams())}
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', p: 0.5 }}>
        <Tabs
          aria-label={t('tabs.ariaLabel')}
          value={activeTab}
          onChange={(_, newValue: number) =>
            updateFilters({ section: ANALYTICS_SECTIONS[newValue] })
          }
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              flex: 1,
              minWidth: 0,
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'none',
              borderRadius: 2,
              minHeight: 44,
            },
          }}
        >
          <Tab
            icon={<BookmarkIcon size={18} />}
            iconPosition="start"
            label={t('tabs.vocabularyGrowth')}
            id="analytics-tab-0"
            aria-controls="analytics-tabpanel-0"
          />
          <Tab
            icon={<BookOpenIcon size={18} />}
            iconPosition="start"
            label={t('tabs.readingProgress')}
            id="analytics-tab-1"
            aria-controls="analytics-tabpanel-1"
          />
          <Tab
            icon={<SparklesIcon size={18} />}
            iconPosition="start"
            label={t('tabs.reviewImpact')}
            id="analytics-tab-2"
            aria-controls="analytics-tabpanel-2"
          />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        <SectionShell
          id="vocabulary-analytics"
          tabPanelId="analytics-tabpanel-0"
          tabLabelledBy="analytics-tab-0"
          title={t('sections.vocabulary.title')}
          refreshingLabel={t('sections.vocabulary.refreshingLabel')}
          loadingLabel={t('sections.vocabulary.loadingLabel')}
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
      ) : null}

      {activeTab === 1 ? (
        <SectionShell
          id="reading-analytics"
          tabPanelId="analytics-tabpanel-1"
          tabLabelledBy="analytics-tab-1"
          title={t('sections.reading.title')}
          refreshingLabel={t('sections.reading.refreshingLabel')}
          loadingLabel={t('sections.reading.loadingLabel')}
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
      ) : null}

      {activeTab === 2 ? (
        <SectionShell
          id="review-analytics"
          tabPanelId="analytics-tabpanel-2"
          tabLabelledBy="analytics-tab-2"
          title={t('sections.review.title')}
          refreshingLabel={t('sections.review.refreshingLabel')}
          loadingLabel={t('sections.review.loadingLabel')}
          isPending={reviewQuery.isPending}
          isFetching={reviewQuery.isFetching}
          error={reviewQuery.isError ? reviewQuery.error : null}
          rangeError={rangeError}
          onRetry={() => void reviewQuery.refetch()}
        >
          {reviewQuery.data ? <ReviewAnalyticsContent data={reviewQuery.data} /> : null}
        </SectionShell>
      ) : null}
    </Stack>
  )
}
