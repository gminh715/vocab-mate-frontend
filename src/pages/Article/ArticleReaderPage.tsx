import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ArticleCefrChip } from '@/components/Article/ArticleChips'
import { ArticleRenderer } from '@/components/Article/ArticleRenderer'
import { ContextualTermDrawer } from '@/components/Article/ContextualTermDrawer'
import { normalizeApiError } from '@/config/apiClient'
import {
  useCompleteReadingMutation,
  useReaderArticleQuery,
} from '@/hooks/Reading/useReading'
import { useReadingProgressPersistence } from '@/hooks/Reading/useReadingProgressPersistence'
import type { ReaderArticleData } from '@/types/Reading/reading'
import { articlePath, routePaths } from '@/utils/paths'

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

const readerErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 400) {
    return 'This article address is not valid. Return to the article library and choose another article.'
  }

  return apiError.status === 0
    ? apiError.message
    : 'The article reader could not be loaded. Try again.'
}

function ReaderLoading() {
  return (
    <Paper
      variant="outlined"
      sx={{ minHeight: 480, display: 'grid', placeItems: 'center' }}
    >
      <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
        <CircularProgress size={36} />
        <Typography color="text.secondary">
          Loading article reader…
        </Typography>
      </Stack>
    </Paper>
  )
}

function ReaderNotFound() {
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
          Article not found
        </Typography>
        <Typography color="text.secondary">
          This article may be unavailable or no longer published. Choose
          another article from the library.
        </Typography>
        <Button
          component={RouterLink}
          to={routePaths.articles}
          variant="outlined"
        >
          Back to articles
        </Button>
      </Stack>
    </Paper>
  )
}

function DisabledAccountState() {
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
          Reading unavailable
        </Typography>
        <Alert severity="warning">
          This account is suspended or disabled. Contact an administrator for
          help.
        </Alert>
        <Button
          component={RouterLink}
          to={routePaths.articles}
          variant="outlined"
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to articles
        </Button>
      </Stack>
    </Paper>
  )
}

function ReaderContent({ data }: { data: ReaderArticleData }) {
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
    : 'Date unavailable'
  const progressLabel =
    progress.status === 'COMPLETED'
      ? 'Complete'
      : `${progressFormatter.format(progress.progressPercent)}% read`
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
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Box
        sx={(theme) => ({
          position: 'fixed',
          inset: '0 0 auto',
          zIndex: theme.zIndex.appBar + 1,
          bgcolor: 'background.paper',
        })}
      >
        <Typography
          id="reading-progress-label"
          aria-live="polite"
          sx={visuallyHidden}
        >
          Reading progress: {progressLabel}
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
        to={articlePath(article.slug)}
        color="inherit"
        sx={{ alignSelf: 'flex-start' }}
      >
        ← Article overview
      </Button>

      <Paper
        component="header"
        variant="outlined"
        sx={{
          overflow: 'hidden',
          borderTop: 5,
          borderTopColor: 'primary.main',
        }}
      >
        <Stack spacing={2.5} sx={{ p: { xs: 2.5, sm: 4, md: 5 } }}>
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
              fontSize: { xs: 38, sm: 50, md: 58 },
              overflowWrap: 'anywhere',
              textWrap: 'balance',
            }}
          >
            {article.title}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              maxWidth: 760,
              fontSize: { xs: 16, sm: 18 },
              lineHeight: 1.65,
              textWrap: 'pretty',
            }}
          >
            {article.summary}
          </Typography>

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
                By {article.authorName}
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
                  Try again
                </Button>
              }
            >
              You reached the end, but the article could not be marked
              complete.
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
              Article content is currently unavailable.
            </Alert>
          )}
        </Paper>

        <Paper
          component="aside"
          variant="outlined"
          aria-labelledby="vocabulary-panel-title"
          sx={{
            position: { md: 'sticky' },
            top: { md: 24 },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ height: 5, bgcolor: 'secondary.main' }} />
          <Stack spacing={1.5} sx={{ p: 2.5 }}>
            <Typography
              id="vocabulary-panel-title"
              component="h2"
              sx={{ fontSize: 19, fontWeight: 800 }}
            >
              Vocabulary
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {highlightedTermIds.length === 0
                ? 'No terms are highlighted for your current level. You can still look up vocabulary prepared for this article.'
                : 'Highlighted words match your learning level. Turn on lookup to explore any vocabulary prepared for this article, including easier terms.'}
            </Typography>
            <Button
              type="button"
              variant={isLookupModeEnabled ? 'contained' : 'outlined'}
              onClick={toggleLookupMode}
              aria-pressed={isLookupModeEnabled}
              fullWidth
            >
              {isLookupModeEnabled
                ? 'Turn off vocabulary lookup'
                : 'Turn on vocabulary lookup'}
            </Button>
            <Typography
              aria-live="polite"
              sx={{ fontSize: 14, fontWeight: 750 }}
            >
              {!isLookupModeEnabled
                ? 'Vocabulary lookup is off.'
                : selectedTermId
                  ? isLookupOpen
                    ? 'Vocabulary details are open.'
                    : 'Term selected. Activate it again to reopen details.'
                  : 'Lookup is on. Select a marked word in the article.'}
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Typography id={termInstructionsId} sx={visuallyHidden}>
        Vocabulary term. Press Enter or Space to select it. Use arrow keys
        to move between marked terms.
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
  const { slug = '' } = useParams()
  const readerQuery = useReaderArticleQuery(slug)

  if (readerQuery.isPending) return <ReaderLoading />

  if (readerQuery.isError) {
    const apiError = normalizeApiError(readerQuery.error)

    if (apiError.status === 403) return <DisabledAccountState />
    if (apiError.status === 404) return <ReaderNotFound />

    return (
      <Stack spacing={2}>
        <Button
          component={RouterLink}
          to={routePaths.articles}
          color="inherit"
          sx={{ alignSelf: 'flex-start' }}
        >
          ← Back to articles
        </Button>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => readerQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {readerErrorMessage(readerQuery.error)}
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
