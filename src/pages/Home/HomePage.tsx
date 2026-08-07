import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { LearningAnalyticsSections } from '@/components/Dashboard/LearningAnalyticsSections'
import { ReviewReadyCard } from '@/components/Dashboard/ReviewReadyCard'
import {
  BookOpenIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ClockIcon,
  FlameIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
} from '@/components/Dashboard/DashboardIcons'
import { useAuth } from '@/contexts/AuthContext'
import { normalizeApiError } from '@/config/apiClient'
import { useAnalyticsOverviewQuery } from '@/hooks/Analytics/useAnalytics'
import { useReadingHistoryQuery } from '@/hooks/Reading/useReading'
import type { AnalyticsOverview } from '@/types/Analytics/analytics'
import type { ReadingHistoryItem } from '@/types/Reading/reading'
import {
  analyticsDateRangeError,
  analyticsFiltersFromSearchParams,
  analyticsRequestParams,
} from '@/utils/Analytics/analyticsParams'
import { readerPath, routePaths } from '@/utils/paths'

const CONTINUE_READING_PARAMS = {
  page: 1,
  limit: 3,
  status: 'READING',
  sort: 'newest',
} as const

const integerFormatter = new Intl.NumberFormat()
const accuracyFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
})
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatAccuracy = (value: number | null | undefined): string =>
  accuracyFormatter.format(
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(1, Math.max(0, value))
      : 0,
  )

const overviewErrorMessage = (error: unknown, t: (key: string) => string): string => {
  const apiError = normalizeApiError(error)
  return apiError.status === 400
    ? t('overview.errorInvalidRange')
    : t('overview.errorMessage')
}

type MetricKey = keyof AnalyticsOverview

interface MetricDefinition {
  key: MetricKey
  labelKey: string
  detailKey: string
  href?: string
  color: string
  bgColor: string
  icon: (size: number, color: string) => ReactNode
  format?: (value: number) => string
}

const metricDefinitions: MetricDefinition[] = [
  {
    key: 'savedVocabulary',
    labelKey: 'overview.metrics.savedVocabulary.label',
    detailKey: 'overview.metrics.savedVocabulary.detail',
    href: routePaths.vocabularies,
    color: '#2563eb',
    bgColor: '#dbeafe',
    icon: (size, color) => <BookmarkIcon size={size} color={color} />,
  },
  {
    key: 'dueToday',
    labelKey: 'overview.metrics.dueToday.label',
    detailKey: 'overview.metrics.dueToday.detail',
    href: `${routePaths.vocabularies}?dueOnly=true`,
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: (size, color) => <FlameIcon size={size} color={color} />,
  },
  {
    key: 'mastered',
    labelKey: 'overview.metrics.mastered.label',
    detailKey: 'overview.metrics.mastered.detail',
    href: `${routePaths.vocabularies}?learningStatus=MASTERED`,
    color: '#059669',
    bgColor: '#d1fae5',
    icon: (size, color) => <CheckCircleIcon size={size} color={color} />,
  },
  {
    key: 'articlesCompleted',
    labelKey: 'overview.metrics.articlesCompleted.label',
    detailKey: 'overview.metrics.articlesCompleted.detail',
    href: `${routePaths.readingHistory}?status=COMPLETED`,
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: (size, color) => <BookOpenIcon size={size} color={color} />,
  },
  {
    key: 'quizAccuracy',
    labelKey: 'overview.metrics.quizAccuracy.label',
    detailKey: 'overview.metrics.quizAccuracy.detail',
    color: '#e11d48',
    bgColor: '#ffe4e6',
    icon: (size, color) => <TargetIcon size={size} color={color} />,
    format: formatAccuracy,
  },
  {
    key: 'sessions',
    labelKey: 'overview.metrics.sessions.label',
    detailKey: 'overview.metrics.sessions.detail',
    color: '#0891b2',
    bgColor: '#cff4fc',
    icon: (size, color) => <TrendingUpIcon size={size} color={color} />,
  },
]

function MetricCard({
  definition,
  value,
}: {
  definition: MetricDefinition
  value: number
}) {
  const { t } = useTranslation('home')
  const label = t(definition.labelKey)
  const formattedVal = definition.format
    ? definition.format(value)
    : integerFormatter.format(value)

  const content = (
    <Box
      sx={{
        p: 2.25,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography
          color="text.secondary"
          sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.01em' }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: definition.bgColor,
            color: definition.color,
            flexShrink: 0,
          }}
        >
          {definition.icon(20, definition.color)}
        </Box>
      </Stack>

      <Box sx={{ mt: 1.5 }}>
        <Typography
          aria-label={`${label}: ${formattedVal}`}
          sx={{
            fontSize: { xs: 32, md: 36 },
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {formattedVal}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2.5,
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        borderTopWidth: 3,
        borderTopColor: definition.color,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          borderColor: definition.color,
        },
      }}
    >
      {definition.href ? (
        <CardActionArea
          component={RouterLink}
          to={definition.href}
          aria-label={t('accessibility.viewMetric', { label: label.toLowerCase() })}
          sx={{ height: '100%', alignItems: 'stretch' }}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  )
}

function OverviewSkeleton() {
  const { t } = useTranslation('home')
  return (
    <Box
      role="status"
      aria-label={t('accessibility.loadingOverview')}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {metricDefinitions.map(({ key }) => (
        <Paper
          key={key}
          variant="outlined"
          sx={{ p: 2.25, minHeight: 132, borderRadius: 2.5 }}
        >
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', mb: 1 }}
          >
            <Skeleton width="50%" />
            <Skeleton variant="circular" width={36} height={36} />
          </Stack>
          <Skeleton width="40%" height={44} />
          <Skeleton width="75%" />
        </Paper>
      ))}
    </Box>
  )
}

function EmptyLearningState() {
  const { t } = useTranslation('home')

  const steps = [
    {
      title: t('empty.steps.0.title'),
      body: t('empty.steps.0.body'),
    },
    {
      title: t('empty.steps.1.title'),
      body: t('empty.steps.1.body'),
    },
    {
      title: t('empty.steps.2.title'),
      body: t('empty.steps.2.body'),
    },
  ]

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        bgcolor: 'primary.light',
        borderColor: 'primary.main',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '0.8fr 2fr' },
          gap: { xs: 2.5, md: 4 },
        }}
      >
        <Box>
          <Typography component="h2" variant="h2" sx={{ fontSize: 24, fontWeight: 700 }}>
            {t('empty.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 14 }}>
            {t('empty.subtitle')}
          </Typography>
          <Button
            component={RouterLink}
            to={routePaths.articles}
            variant="contained"
            sx={{ mt: 2, borderRadius: 2 }}
          >
            {t('empty.cta')}
          </Button>
        </Box>
        <Stack
          component="ol"
          spacing={1.5}
          sx={{ m: 0, p: 0, listStyle: 'none' }}
        >
          {steps.map((step, index) => (
            <Box
              component="li"
              key={step.title}
              sx={{
                display: 'grid',
                gridTemplateColumns: '32px minmax(0, 1fr)',
                gap: 1.5,
              }}
            >
              <Typography
                aria-hidden="true"
                sx={{
                  color: 'primary.dark',
                  fontFamily: '"Merriweather", serif',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.body}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Paper>
  )
}



function ContinueReadingCard({ item }: { item: ReadingHistoryItem }) {
  const { t } = useTranslation('home')
  const progress = Math.min(100, Math.max(0, item.progressPercent))
  const isAvailable = item.article.status === 'PUBLISHED'
  const lastReadDate = dateFormatter.format(new Date(item.lastReadAt))
  const content = (
    <Stack
      spacing={1.5}
      sx={{ height: '100%', justifyContent: 'space-between' }}
    >
      <Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography
            component="h3"
            sx={{
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.article.title}
          </Typography>
          <Chip
            size="small"
            label={`${integerFormatter.format(progress)}%`}
            color="primary"
            sx={{ height: 22, fontSize: 11, fontWeight: 700 }}
          />
        </Stack>
      </Box>

      <Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          aria-label={`${item.article.title} reading progress`}
          sx={{ height: 6, borderRadius: 99, mb: 1, bgcolor: 'action.hover' }}
        />
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <ClockIcon size={14} color="gray" />
          <Typography variant="caption" color="text.secondary">
            {isAvailable
              ? t('continueReading.lastRead', { date: lastReadDate })
              : t('continueReading.archived', { date: lastReadDate })}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  )

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          borderColor: 'primary.main',
        },
      }}
    >
      {isAvailable ? (
        <CardActionArea
          component={RouterLink}
          to={readerPath(item.article.slug)}
          aria-label={t('continueReading.continueLabel', { title: item.article.title })}
          sx={{ height: '100%', p: 2.25 }}
        >
          {content}
        </CardActionArea>
      ) : (
        <Box sx={{ p: 2.25 }}>{content}</Box>
      )}
    </Card>
  )
}

function SectionHeading({
  id,
  title,
  action,
}: {
  id: string
  title: string
  detail?: string
  action?: ReactNode
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
    >
      <Box>
        <Typography
          id={id}
          component="h2"
          variant="h2"
          sx={{ fontSize: { xs: 22, sm: 24 }, fontWeight: 700 }}
        >
          {title}
        </Typography>
      </Box>
      {action}
    </Stack>
  )
}

export function HomePage() {
  const { t } = useTranslation('home')
  const { currentUser } = useAuth()
  const [searchParams] = useSearchParams()
  const searchString = searchParams.toString()
  const analyticsFilters = useMemo(
    () => analyticsFiltersFromSearchParams(new URLSearchParams(searchString)),
    [searchString],
  )
  const overviewParams = useMemo(
    () => analyticsRequestParams(analyticsFilters),
    [analyticsFilters],
  )
  const rangeError = analyticsDateRangeError(analyticsFilters)
  const overviewQuery = useAnalyticsOverviewQuery(
    overviewParams,
    rangeError === null,
  )
  const readingQuery = useReadingHistoryQuery(CONTINUE_READING_PARAMS)
  const overview = overviewQuery.data
  const continueReading = readingQuery.data?.items ?? []
  const resumableArticle = continueReading.find(
    (item) => item.article.status === 'PUBLISHED',
  )
  const primaryPath = resumableArticle
    ? readerPath(resumableArticle.article.slug)
    : routePaths.articles
  const allMetricsZero =
    overview !== undefined &&
    metricDefinitions.every(({ key }) => overview[key] === 0)

  return (
    <Stack spacing={{ xs: 3.5, md: 4.5 }}>
      <Paper
        component="header"
        variant="outlined"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 3, sm: 4, md: 4.5 },
          borderRadius: 3,
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.light}25 100%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 'auto -5% -60px 45%',
            height: 180,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            opacity: 0.4,
            filter: 'blur(40px)',
            transform: 'rotate(-10deg)',
            zIndex: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 1 }}
          >
            <Chip
              icon={<SparklesIcon size={14} color="inherit" />}
              size="small"
              label={t('header.chip')}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
            {currentUser?.profile.currentCefrLevel ? (
              <Chip
                size="small"
                label={`CEFR Level ${currentUser.profile.currentCefrLevel}`}
                color="secondary"
                sx={{ fontWeight: 700 }}
              />
            ) : null}
          </Stack>
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: 28, sm: 36, md: 42 },
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {t('header.welcome', { name: currentUser?.profile.displayName })}
          </Typography>
          <Button
            component={RouterLink}
            to={primaryPath}
            variant="contained"
            size="large"
            startIcon={<BookOpenIcon size={18} />}
            sx={{ mt: 2.5, borderRadius: 2, px: 3, py: 1.25, boxShadow: 2 }}
          >
            {resumableArticle ? t('header.continueLearning') : t('header.browseArticles')}
          </Button>
        </Box>
      </Paper>

      <ReviewReadyCard />

      <Stack component="section" spacing={2} aria-labelledby="overview-title">
        <SectionHeading
          id="overview-title"
          title={t('overview.title')}
        />
        {rangeError ? (
          <Alert severity="info">
            {t('overview.rangeErrorAlert')}
          </Alert>
        ) : overviewQuery.isPending ? (
          <OverviewSkeleton />
        ) : overviewQuery.isError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={() => void overviewQuery.refetch()}
              >
                {t('overview.tryAgain')}
              </Button>
            }
          >
            {overviewErrorMessage(overviewQuery.error, t)}
          </Alert>
        ) : overview ? (
          <>
            {allMetricsZero ? <EmptyLearningState /> : null}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              {metricDefinitions.map((definition) => (
                <MetricCard
                  key={definition.key}
                  definition={definition}
                  value={overview[definition.key]}
                />
              ))}
            </Box>
          </>
        ) : null}
      </Stack>

      <Stack component="section" spacing={2} aria-labelledby="continue-title">
        <SectionHeading
          id="continue-title"
          title={t('continueReading.title')}
          action={
            <Button
              component={RouterLink}
              to={routePaths.readingHistory}
              aria-label={t('continueReading.historyButton')}
              size="small"
            >
              {t('continueReading.historyButton')}
            </Button>
          }
        />
        {readingQuery.isPending ? (
          <Box
            role="status"
            aria-label={t('continueReading.loadingLabel')}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {[1, 2, 3].map((key) => (
              <Skeleton
                key={key}
                variant="rounded"
                height={150}
                sx={{ borderRadius: 2.5 }}
              />
            ))}
          </Box>
        ) : readingQuery.isError ? (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                onClick={() => void readingQuery.refetch()}
              >
                {t('continueReading.tryAgain')}
              </Button>
            }
          >
            {t('continueReading.errorMessage')}
          </Alert>
        ) : continueReading.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {t('continueReading.empty.title')}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14 }}>
              {t('continueReading.empty.subtitle')}
            </Typography>
            <Button
              component={RouterLink}
              to={routePaths.articles}
              variant="outlined"
              sx={{ mt: 1.5, borderRadius: 2 }}
            >
              {t('continueReading.empty.cta')}
            </Button>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {continueReading.map((item) => (
              <ContinueReadingCard key={item.articleId} item={item} />
            ))}
          </Box>
        )}
      </Stack>

      <LearningAnalyticsSections />
    </Stack>
  )
}
