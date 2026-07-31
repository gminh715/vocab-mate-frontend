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
import {
  Link as RouterLink,
  useSearchParams,
} from 'react-router-dom'
import { LearningAnalyticsSections } from '@/components/Dashboard/LearningAnalyticsSections'
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
import {
  readerPath,
  routePaths,
} from '@/utils/paths'

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

const overviewErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  return apiError.status === 400
    ? 'The analytics date range is invalid. Refresh the page to use the default range.'
    : 'Your learning overview could not be loaded. Try again.'
}

interface MetricDefinition {
  key: keyof AnalyticsOverview
  label: string
  detail: string
  href?: string
  format?: (value: number) => string
}

const metricDefinitions: MetricDefinition[] = [
  {
    key: 'savedVocabulary',
    label: 'Saved vocabulary',
    detail: 'Words and phrases in your library',
    href: routePaths.vocabularies,
  },
  {
    key: 'dueToday',
    label: 'Due today',
    detail: 'Vocabulary ready to review',
    href: `${routePaths.vocabularies}?dueOnly=true`,
  },
  {
    key: 'mastered',
    label: 'Mastered',
    detail: 'Vocabulary marked as mastered',
    href: `${routePaths.vocabularies}?learningStatus=MASTERED`,
  },
  {
    key: 'articlesCompleted',
    label: 'Articles completed',
    detail: 'Finished in the selected date range',
    href: `${routePaths.readingHistory}?status=COMPLETED`,
  },
  {
    key: 'quizAccuracy',
    label: 'Quiz accuracy',
    detail: 'Answer accuracy in completed sessions',
    format: formatAccuracy,
  },
  {
    key: 'sessions',
    label: 'Completed sessions',
    detail: 'Review sessions in the selected date range',
  },
]

function MetricCard({
  definition,
  value,
}: {
  definition: MetricDefinition
  value: number
}) {
  const content = (
    <Stack spacing={0.75} sx={{ alignItems: 'flex-start' }}>
      <Typography
        color="text.secondary"
        sx={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.025em' }}
      >
        {definition.label}
      </Typography>
      <Typography
        aria-label={`${definition.label}: ${
          definition.format
            ? definition.format(value)
            : integerFormatter.format(value)
        }`}
        sx={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: { xs: 34, md: 38 },
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.035em',
          lineHeight: 1,
        }}
      >
        {definition.format
          ? definition.format(value)
          : integerFormatter.format(value)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {definition.detail}
      </Typography>
    </Stack>
  )

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderTopWidth: 3,
        borderTopColor:
          definition.key === 'dueToday' ? 'secondary.main' : 'primary.main',
      }}
    >
      {definition.href ? (
        <CardActionArea
          component={RouterLink}
          to={definition.href}
          aria-label={`View ${definition.label.toLowerCase()}`}
          sx={{ height: '100%', p: 2.25, alignItems: 'stretch' }}
        >
          {content}
        </CardActionArea>
      ) : (
        <Box sx={{ p: 2.25 }}>{content}</Box>
      )}
    </Card>
  )
}

function OverviewSkeleton() {
  return (
    <Box
      role="status"
      aria-label="Loading learning overview"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 1.5,
      }}
    >
      {metricDefinitions.map(({ key }) => (
        <Paper key={key} variant="outlined" sx={{ p: 2.25, minHeight: 132 }}>
          <Skeleton width="60%" />
          <Skeleton width="38%" height={48} />
          <Skeleton width="85%" />
        </Paper>
      ))}
    </Box>
  )
}

function EmptyLearningState() {
  const steps = [
    {
      title: 'Read your first article',
      body: 'Choose a story at your level and begin your reading trail.',
    },
    {
      title: 'Save useful vocabulary',
      body: 'Select prepared terms while reading to build your review list.',
    },
    {
      title: 'Complete your first quiz',
      body: 'When an article has a published quiz, finish it to start tracking accuracy.',
    },
  ]

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
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
          <Typography component="h2" variant="h2" sx={{ fontSize: 28 }}>
            Start your learning trail
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Three small milestones will bring this dashboard to life.
          </Typography>
          <Button
            component={RouterLink}
            to={routePaths.articles}
            variant="contained"
            sx={{ mt: 2 }}
          >
            Find your first article
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
                  fontFamily: 'Georgia, serif',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{step.title}</Typography>
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

function QuickAction({
  title,
  detail,
  to,
  emphasis = false,
}: {
  title: string
  detail: string
  to: string
  emphasis?: boolean
}) {
  return (
    <Button
      component={RouterLink}
      to={to}
      variant={emphasis ? 'contained' : 'outlined'}
      sx={{
        minHeight: 88,
        p: 1.75,
        justifyContent: 'flex-start',
        textAlign: 'left',
      }}
    >
      <Box>
        <Typography component="span" sx={{ display: 'block', fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography
          component="span"
          variant="body2"
          sx={{
            display: 'block',
            mt: 0.25,
            color: emphasis ? 'primary.contrastText' : 'text.secondary',
            fontWeight: 400,
          }}
        >
          {detail}
        </Typography>
      </Box>
    </Button>
  )
}

function ContinueReadingCard({ item }: { item: ReadingHistoryItem }) {
  const progress = Math.min(100, Math.max(0, item.progressPercent))
  const isAvailable = item.article.status === 'PUBLISHED'
  const content = (
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Typography
          component="h3"
          sx={{
            fontFamily: 'Georgia, serif',
            fontSize: 21,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {item.article.title}
        </Typography>
        <Chip
          size="small"
          label={`${integerFormatter.format(progress)}%`}
          color="primary"
          variant="outlined"
        />
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        aria-label={`${item.article.title} reading progress`}
        sx={{ height: 7, borderRadius: 99 }}
      />
      <Typography variant="body2" color="text.secondary">
        {isAvailable ? null : 'Archived · '}
        Last read {dateFormatter.format(new Date(item.lastReadAt))}
      </Typography>
    </Stack>
  )

  return (
    <Card component="article" variant="outlined">
      {isAvailable ? (
        <CardActionArea
          component={RouterLink}
          to={readerPath(item.article.slug)}
          aria-label={`Continue reading ${item.article.title}`}
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
  detail,
  action,
}: {
  id: string
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { sm: 'end' }, justifyContent: 'space-between' }}
    >
      <Box>
        <Typography id={id} component="h2" variant="h2" sx={{ fontSize: 28 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {detail}
        </Typography>
      </Box>
      {action}
    </Stack>
  )
}

export function HomePage() {
  const { currentUser } = useAuth()
  const [searchParams] = useSearchParams()
  const searchString = searchParams.toString()
  const analyticsFilters = useMemo(
    () =>
      analyticsFiltersFromSearchParams(
        new URLSearchParams(searchString),
      ),
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
    <Stack spacing={{ xs: 4, md: 5 }}>
      <Paper
        component="header"
        variant="outlined"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 2.5, sm: 4, md: 5 },
          bgcolor: 'background.paper',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 'auto -10% -64px 42%',
            height: 150,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            transform: 'rotate(-7deg)',
            zIndex: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Typography
              sx={{
                color: 'primary.main',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
              }}
            >
              Today&apos;s learning trail
            </Typography>
            {currentUser?.profile.currentCefrLevel ? (
              <Chip
                size="small"
                label={`CEFR ${currentUser.profile.currentCefrLevel}`}
                color="primary"
                variant="outlined"
              />
            ) : null}
          </Stack>
          <Typography
            component="h1"
            variant="h1"
            sx={{ mt: 1.5, fontSize: { xs: 40, sm: 52, md: 62 } }}
          >
            Welcome back, {currentUser?.profile.displayName}.
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1.5, maxWidth: 620, fontSize: { sm: 18 } }}
          >
            Keep the words you meet in context, then return to them when
            they are ready for review.
          </Typography>
          <Button
            component={RouterLink}
            to={primaryPath}
            variant="contained"
            size="large"
            sx={{ mt: 2.5 }}
          >
            {resumableArticle ? 'Continue learning' : 'Find an article'}
          </Button>
        </Box>
      </Paper>

      <Stack component="section" spacing={2} aria-labelledby="overview-title">
        <SectionHeading
          id="overview-title"
          title="Your overview"
          detail="Current vocabulary totals and learning activity from the selected analytics range."
        />
        {rangeError ? (
          <Alert severity="info">
            Fix the analytics date range below to load your overview.
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
                Try again
              </Button>
            }
          >
            {overviewErrorMessage(overviewQuery.error)}
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
                gap: 1.5,
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

      <Stack component="section" spacing={2} aria-labelledby="actions-title">
        <SectionHeading
          id="actions-title"
          title="Choose your next step"
          detail="Move from reading to saving and reviewing without losing your place."
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1.5,
          }}
        >
          <QuickAction
            title="Find an article"
            detail="Browse stories by level and topic."
            to={routePaths.articles}
            emphasis
          />
          {resumableArticle ? (
            <QuickAction
              title="Continue reading"
              detail={resumableArticle.article.title}
              to={readerPath(resumableArticle.article.slug)}
            />
          ) : (
            <QuickAction
              title="Reading history"
              detail="Return to articles you have opened."
              to={routePaths.readingHistory}
            />
          )}
          <QuickAction
            title="Review due vocabulary"
            detail={
              overview?.dueToday
                ? `${integerFormatter.format(overview.dueToday)} ready today.`
                : 'Check your due vocabulary list.'
            }
            to={`${routePaths.vocabularies}?dueOnly=true`}
          />
          <QuickAction
            title="Saved vocabulary"
            detail="Browse words and collections."
            to={routePaths.vocabularies}
          />
        </Box>
      </Stack>

      <Stack component="section" spacing={2} aria-labelledby="continue-title">
        <SectionHeading
          id="continue-title"
          title="Continue reading"
          detail="Your most recently read in-progress articles, in backend order."
          action={
            <Button
              component={RouterLink}
              to={`${routePaths.readingHistory}?status=READING`}
              size="small"
            >
              View reading history
            </Button>
          }
        />
        {readingQuery.isPending ? (
          <Box
            role="status"
            aria-label="Loading in-progress articles"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {[1, 2, 3].map((key) => (
              <Skeleton
                key={key}
                variant="rounded"
                height={150}
                sx={{ borderRadius: 3 }}
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
                Try again
              </Button>
            }
          >
            Your overview is still available, but in-progress articles could
            not be loaded.
          </Alert>
        ) : continueReading.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 800 }}>
              No article is waiting for you
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Start an article and it will appear here until you finish it.
            </Typography>
            <Button
              component={RouterLink}
              to={routePaths.articles}
              variant="outlined"
              sx={{ mt: 1.5 }}
            >
              Browse articles
            </Button>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
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
