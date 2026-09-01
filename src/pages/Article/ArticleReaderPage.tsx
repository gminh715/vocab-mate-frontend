import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ArticleCefrChip } from '@/components/Article/ArticleChips'
import { ArticleRenderer } from '@/components/Article/ArticleRenderer'
import { ContextualTermDrawer } from '@/components/Article/ContextualTermDrawer'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import { LoadingState } from '@/components/Shared/LoadingState'
import { normalizeApiError } from '@/config/apiClient'
import {
  useCompleteReadingMutation,
  useReaderArticleQuery,
} from '@/hooks/Reading/useReading'
import { useReadingProgressPersistence } from '@/hooks/Reading/useReadingProgressPersistence'
import type { ReaderArticleData } from '@/types/Reading/reading'
import { routePaths } from '@/utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
})

const progressFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

const termInstructionsId = 'reader-term-instructions'

function ReaderLoading() {
  return <LoadingState minHeight={480} size={36} />
}

function ReaderNotFound() {
  const { t } = useTranslation('articles')

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'grid',
        minHeight: 400,
        placeItems: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 540 }}>
        <Typography component="h1" variant="h1" sx={{ fontSize: 40 }}>
          {t('reader.notFound.title')}
        </Typography>
        <Typography color="text.secondary">
          {t('reader.notFound.subtitle')}
        </Typography>
        <Button
          component={RouterLink}
          to={routePaths.articles}
          variant="outlined"
        >
          {t('reader.notFound.backButton')}
        </Button>
      </Stack>
    </Paper>
  )
}

function DisabledAccountState() {
  const { t } = useTranslation('articles')

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'grid',
        minHeight: 400,
        placeItems: 'center',
        p: 3,
      }}
    >
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 580 }}>
        <Typography component="h1" variant="h1" sx={{ fontSize: 40 }}>
          {t('reader.disabled.title')}
        </Typography>
        <Alert severity="warning">
          {t('reader.disabled.alert')}
        </Alert>
        <Button
          component={RouterLink}
          to={routePaths.articles}
          variant="outlined"
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('reader.disabled.backButton')}
        </Button>
      </Stack>
    </Paper>
  )
}

function ReaderContent({ data }: { data: ReaderArticleData }) {
  const { t } = useTranslation('articles')
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [isLookupOpen, setIsLookupOpen] = useState(false)
  const [isLookupModeEnabled, setIsLookupModeEnabled] = useState(false)
  const readerContainerRef = useRef<HTMLDivElement | null>(null)
  const progressActionInFlightRef = useRef(false)
  const automaticCompletionAttemptedRef = useRef(
    data.progress.status === 'COMPLETED',
  )
  const { article, contentHtml, highlightedTermIds } = data
  const completeMutation = useCompleteReadingMutation(article.slug)
  const {
    progress,
    applyComplete,
    prepareProgressAction,
    resumeProgress,
  } =
    useReadingProgressPersistence({
      articleId: article.id,
      containerRef: readerContainerRef,
      initialProgress: data.progress,
      slug: article.slug,
    })
  const selectTerm = useCallback((termId: string) => {
    setSelectedTermId(termId)
    setIsLookupOpen(true)
  }, [])
  const closeLookup = useCallback(() => {
    setIsLookupOpen(false)
    setSelectedTermId(null)
  }, [])
  const toggleLookupMode = () => {
    const nextIsEnabled = !isLookupModeEnabled
    setIsLookupModeEnabled(nextIsEnabled)

    if (!nextIsEnabled) {
      closeLookup()
    }
  }
  const publishedDate = article.publishedAt
    ? dateFormatter.format(new Date(article.publishedAt))
    : t('list.dateUnavailable')
  const progressLabel =
    progress.status === 'COMPLETED'
      ? t('reader.progress.complete')
      : t('reader.progress.percent', { value: progressFormatter.format(progress.progressPercent) })
  const completeAtEnd = useCallback(async () => {
    if (
      automaticCompletionAttemptedRef.current ||
      progressActionInFlightRef.current
    ) {
      return
    }

    automaticCompletionAttemptedRef.current = true
    progressActionInFlightRef.current = true

    try {
      await prepareProgressAction()
      const result = await completeMutation.mutateAsync(article.id)
      applyComplete(result.progress)
    } catch {
      resumeProgress()
    } finally {
      progressActionInFlightRef.current = false
    }
  }, [
    applyComplete,
    article.id,
    completeMutation,
    prepareProgressAction,
    resumeProgress,
  ])

  useEffect(() => {
    if (
      progress.status !== 'COMPLETED' &&
      progress.progressPercent >= 100
    ) {
      void completeAtEnd()
    }
  }, [completeAtEnd, progress.progressPercent, progress.status])

  const retryAutomaticCompletion = () => {
    automaticCompletionAttemptedRef.current = false
    completeMutation.reset()
    void completeAtEnd()
  }

  return (
    <Stack spacing={{ xs: 1, md: 1.5 }} sx={{ minWidth: 0, maxWidth: '100%' }}>
      <Box
        sx={(theme) => ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar + 1,
          bgcolor: 'background.paper',
        })}
      >
        <Typography
          id="reading-progress-label"
          aria-live="polite"
          sx={visuallyHidden}
        >
          {t('reader.progress.label', { label: progressLabel })}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress.progressPercent}
          aria-labelledby="reading-progress-label"
          sx={{
            height: 5,
            bgcolor: 'primary.light',
          }}
        />
      </Box>

      <Button
        component={RouterLink}
        to={routePaths.articles}
        color="inherit"
        sx={{ alignSelf: 'flex-start', minWidth: 0 }}
      >
        {t('reader.backButton')}
      </Button>

      <Paper
        component="header"
        variant="outlined"
        sx={{
          overflow: 'hidden',
          borderTop: 5,
          borderTopColor: 'primary.main',
          minWidth: 0,
          maxWidth: '100%',
          borderRadius: 3,
        }}
      >
        {article.thumbnailUrl ? (
          <Box
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={article.thumbnailUrl}
              alt={article.title}
              loading="eager"
              sx={{
                display: 'block',
                width: '100%',
                height: 'auto',
                maxHeight: { xs: 400, sm: 550, md: 650 },
                objectFit: 'contain',
              }}
            />
          </Box>
        ) : null}

        <Stack
          spacing={1.25}
          sx={{
            py: { xs: 1.5, sm: 2, md: 2.5 },
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
          >
            <Chip label={article.category.name} size="small" />
            <ArticleCefrChip level={article.cefrLevel} />
          </Stack>

          <Typography
            component="h1"
            variant="h1"
            sx={{
              maxWidth: 900,
              fontSize: { xs: 24, sm: 30, md: 36 },
              textWrap: 'balance',
            }}
          >
            {article.title}
          </Typography>

          {article.summary ? (
            <Typography
              color="text.secondary"
              sx={{
                maxWidth: 820,
                fontSize: { xs: 15, sm: 17 },
                lineHeight: 1.65,
                textWrap: 'pretty',
              }}
            >
              {article.summary}
            </Typography>
          ) : null}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 2 }}
            divider={
              <Divider
                flexItem
                orientation="vertical"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              />
            }
            sx={{ color: 'text.secondary' }}
          >
            <Typography variant="body2">{publishedDate}</Typography>
            {article.authorName ? (
              <Typography variant="body2">
                {t('reader.meta.by', { name: article.authorName })}
              </Typography>
            ) : null}
            {article.sourceName ? (
              <Typography variant="body2">
                {article.sourceName}
              </Typography>
            ) : null}
          </Stack>

          {completeMutation.isError &&
          progress.status !== 'COMPLETED' ? (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  onClick={retryAutomaticCompletion}
                >
                  {t('reader.errors.retryCompletion')}
                </Button>
              }
            >
              {t('reader.errors.completionFailed')}
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 1fr) 260px',
          },
          gap: { xs: 3, md: 4 },
          alignItems: 'start',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        <Paper
          ref={readerContainerRef}
          variant="outlined"
          sx={{
            minWidth: 0,
            p: { xs: 2.5, sm: 4.5, md: 6 },
          }}
        >
          {contentHtml.trim() ? (
            <ArticleRenderer
              contentHtml={contentHtml}
              highlightedTermIds={highlightedTermIds}
              selectedTermId={selectedTermId}
              onTermSelect={
                isLookupModeEnabled ? selectTerm : undefined
              }
              termInstructionsId={termInstructionsId}
              ariaLabel={article.title}
            />
          ) : (
            <Alert severity="info">
              {t('reader.errors.contentUnavailable')}
            </Alert>
          )}
        </Paper>

        <Paper
          component="aside"
          variant="outlined"
          aria-labelledby="vocabulary-panel-title"
          sx={{
            position: { md: 'sticky' },
            top: { md: 88 },
            alignSelf: 'start',
            overflow: 'hidden',
            borderRadius: 3,
          }}
        >
          <Box sx={{ height: 5, bgcolor: 'secondary.main' }} />
          <Stack spacing={1.5} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <SparklesIcon size={20} color="#16A34A" />
              <Typography
                id="vocabulary-panel-title"
                component="h2"
                sx={{ fontSize: 18, fontWeight: 800 }}
              >
                {t('reader.vocabulary.panelTitle')}
              </Typography>
            </Stack>

            <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.5 }}>
              {highlightedTermIds.length === 0
                ? t('reader.vocabulary.noHighlights')
                : t('reader.vocabulary.hasHighlights')}
            </Typography>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: isLookupModeEnabled ? 'rgba(22, 163, 74, 0.08)' : 'background.default',
                border: 1,
                borderColor: isLookupModeEnabled ? 'primary.main' : 'divider',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: isLookupModeEnabled ? 'primary.dark' : 'text.primary',
                  }}
                >
                  {t('reader.vocabulary.switchLabel')}
                </Typography>
                <Switch
                  checked={isLookupModeEnabled}
                  onChange={toggleLookupMode}
                  color="primary"
                  size="medium"
                  slotProps={{ input: { 'aria-label': t('reader.vocabulary.switchLabel') } }}
                />
              </Stack>
            </Box>

            <Typography
              aria-live="polite"
              sx={{
                fontSize: 13,
                fontWeight: 650,
                color: isLookupModeEnabled ? 'primary.main' : 'text.secondary',
              }}
            >
              {!isLookupModeEnabled
                ? t('reader.vocabulary.statusOff')
                : selectedTermId
                  ? isLookupOpen
                    ? t('reader.vocabulary.statusOpen')
                    : t('reader.vocabulary.statusSelected')
                  : t('reader.vocabulary.statusOn')}
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Typography id={termInstructionsId} sx={visuallyHidden}>
        {t('reader.termInstructions')}
      </Typography>

      <ContextualTermDrawer
        articleId={article.id}
        termId={selectedTermId}
        open={isLookupOpen}
        onClose={closeLookup}
      />
    </Stack>
  )
}

export function ArticleReaderPage() {
  const { t } = useTranslation('articles')
  const { slug = '' } = useParams()
  const readerQuery = useReaderArticleQuery(slug)

  if (readerQuery.isPending) return <ReaderLoading />

  if (readerQuery.isError) {
    const apiError = normalizeApiError(readerQuery.error)

    if (apiError.status === 403) return <DisabledAccountState />
    if (apiError.status === 404) return <ReaderNotFound />

    const getErrorMessage = (): string => {
      if (apiError.status === 400) return t('reader.errors.invalidAddress')
      return apiError.status === 0 ? apiError.message : t('reader.errors.loadError')
    }

    return (
      <Stack spacing={2}>
        <Button
          component={RouterLink}
          to={routePaths.articles}
          color="inherit"
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('reader.backButton')}
        </Button>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => readerQuery.refetch()}>
              {t('reader.errors.tryAgain')}
            </Button>
          }
        >
          {getErrorMessage()}
        </Alert>
      </Stack>
    )
  }

  return (
    <ReaderContent
      key={readerQuery.data.article.id}
      data={readerQuery.data}
    />
  )
}
