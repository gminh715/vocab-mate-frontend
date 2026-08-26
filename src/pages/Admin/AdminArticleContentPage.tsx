import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import TablePagination from '@mui/material/TablePagination'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import {
  Link as RouterLink,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ArticleClassification } from '@/components/Article/ArticleChips'
import { ArticleSentenceEditor } from '@/components/Article/ArticleSentenceEditor'
import { ArticleTermDrawer } from '@/components/Article/ArticleTermDrawer'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import { DebouncedSearchField } from '@/components/Shared/DebouncedSearchField'
import { normalizeApiError } from '@/config/apiClient'
import {
  useArchiveAdminArticleMutation,
  useAnalyzeAdminArticleMutation,
  useApproveAdminArticleTermMutation,
  useCreateAdminArticleTermMutation,
  useDeleteAdminArticleTermMutation,
  useParseAdminArticleContentMutation,
  usePublishAdminArticleMutation,
  useRestoreAdminArticleDraftMutation,
  useRejectAdminArticleTermMutation,
  useAdminArticleSentenceDetailQuery,
  useAdminArticleSentenceListQuery,
  useAdminArticleTermDetailQuery,
  useAdminArticleTermListQuery,
  useUpdateAdminArticleSentenceMutation,
  useUpdateAdminArticleTermMutation,
} from '@/hooks/Admin/useAdminArticleContent'
import { useAdminArticleDetailQuery } from '@/hooks/Admin/useAdminArticles'
import type {
  ArticleSentence,
  ArticleSentenceDetail,
  ArticleSentenceTerm,
  ArticleTermListItem,
  CreateArticleTermRequest,
  PublicationValidationIssue,
  UpdateArticleSentenceRequest,
  UpdateArticleTermRequest,
} from '@/types/Admin/adminArticleContent'
import { LEXICAL_UNIT_TYPES } from '@/types/Admin/adminArticleContent'
import {
  TERM_ORIGINS,
  TERM_REVIEW_STATUSES,
} from '@/types/Admin/adminArticleContent'
import { AI_GENERATION_STATUSES } from '@/types/Admin/adminArticles'
import { CEFR_LEVELS } from '@/types/Auth/auth'
import {
  adminArticleEditPath,
  adminArticlePreviewPath,
  routePaths,
} from '@/utils/paths'

const positiveInteger = (
  value: string | null,
  fallback: number,
  maximum = Number.POSITIVE_INFINITY,
) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : fallback
}

const optionalBoolean = (value: string | null) =>
  value === 'true' ? true : value === 'false' ? false : undefined

const apiMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

interface Feedback {
  severity: 'success' | 'error' | 'warning'
  message: string
}

interface ModerationTarget {
  term: ArticleSentenceTerm
  action: 'approve' | 'reject'
}

interface SummaryValueProps {
  label: string
  value: string | number
}

function SummaryValue({ label, value }: SummaryValueProps) {
  return (
    <Box>
      <Typography
        color="text.secondary"
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.35,
          fontSize: 20,
          fontWeight: 750,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

interface CreateTermDrawerContainerProps {
  articleId: string
  sentence: ArticleSentence
  open: boolean
  onClose: () => void
  onSaved: () => void
}

function CreateTermDrawerContainer({
  articleId,
  sentence,
  open,
  onClose,
  onSaved,
}: CreateTermDrawerContainerProps) {
  const mutation = useCreateAdminArticleTermMutation(articleId, sentence.id)

  const submit = async (request: CreateArticleTermRequest) => {
    await mutation.mutateAsync(request)
    onSaved()
    onClose()
  }

  return (
    <ArticleTermDrawer
      mode="create"
      sentence={sentence}
      open={open}
      isPending={mutation.isPending}
      serverError={mutation.isError ? apiMessage(mutation.error) : null}
      onClose={onClose}
      onSubmit={submit}
    />
  )
}

interface EditTermDrawerContainerProps {
  articleId: string
  termId: string
  onClose: () => void
  onSaved: () => void
}

function EditTermDrawerContainer({
  articleId,
  termId,
  onClose,
  onSaved,
}: EditTermDrawerContainerProps) {
  const detailQuery = useAdminArticleTermDetailQuery(articleId, termId)
  const mutation = useUpdateAdminArticleTermMutation(articleId, termId)

  if (detailQuery.isPending) {
    return (
      <Dialog open onClose={onClose} aria-labelledby="loading-term-title">
        <DialogTitle id="loading-term-title">Edit term</DialogTitle>
        <DialogContent>
          <Stack
            role="status"
            spacing={1.5}
            sx={{ minWidth: 280, alignItems: 'center', py: 5 }}
          >
            <CircularProgress size={30} />
            <Typography color="text.secondary">Loading term…</Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    )
  }

  if (detailQuery.isError) {
    return (
      <Dialog open onClose={onClose} aria-labelledby="term-error-title">
        <DialogTitle id="term-error-title">Edit term</DialogTitle>
        <DialogContent>
          <Alert severity="error">{apiMessage(detailQuery.error)}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button onClick={() => detailQuery.refetch()}>Try again</Button>
        </DialogActions>
      </Dialog>
    )
  }

  const submit = async (request: UpdateArticleTermRequest) => {
    await mutation.mutateAsync(request)
    onSaved()
    onClose()
  }

  return (
    <ArticleTermDrawer
      mode="edit"
      sentence={detailQuery.data.sentence}
      term={detailQuery.data.term}
      open
      isPending={mutation.isPending}
      serverError={mutation.isError ? apiMessage(mutation.error) : null}
      onClose={onClose}
      onSubmit={submit}
    />
  )
}

interface SentenceTermsProps {
  articleId: string
  detail: ArticleSentenceDetail
  isReadOnly: boolean
  onEditTerm: (termId: string) => void
  onDeleteTerm: (term: ArticleSentenceTerm) => void
  onFeedback: (feedback: Feedback) => void
}

function SentenceTerms({
  articleId,
  detail,
  isReadOnly,
  onEditTerm,
  onDeleteTerm,
  onFeedback,
}: SentenceTermsProps) {
  const [isCreating, setIsCreating] = useState(false)

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Box>
          <Typography variant="h2" sx={{ fontSize: 23 }}>
            Contextual terms
          </Typography>
          <Typography color="text.secondary">
            {detail.terms.length}{' '}
            {detail.terms.length === 1 ? 'term' : 'terms'} in this sentence
          </Typography>
        </Box>
        <Button
          variant="outlined"
          disabled={isReadOnly || !detail.sentence.isActive}
          onClick={() => setIsCreating(true)}
        >
          Add term
        </Button>
      </Stack>

      {!detail.sentence.isActive && !isReadOnly ? (
        <Alert severity="info">
          Activate this sentence before adding or changing term markers.
        </Alert>
      ) : null}

      {detail.terms.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography color="text.secondary">
            No contextual terms belong to this sentence yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {detail.terms.map((term) => (
            <Paper key={term.id} variant="outlined" sx={{ p: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ justifyContent: 'space-between' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ flexWrap: 'wrap', gap: 0.75 }}
                  >
                    <Typography sx={{ fontWeight: 750 }}>
                      {term.wordDisplay ?? term.value}
                    </Typography>
                    <Chip
                      label={term.cefrLevel ?? 'CEFR pending'}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    {!term.isActive ? (
                      <Chip label="Inactive" size="small" />
                    ) : null}
                    {!term.isLookupEnabled ? (
                      <Chip label="Lookup disabled" size="small" />
                    ) : null}
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {term.contextualMeaningVi}
                  </Typography>
                </Box>
                {!isReadOnly ? (
                  <Stack direction="row" spacing={0.5}>
                    <Button
                      size="small"
                      onClick={() => onEditTerm(term.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => onDeleteTerm(term)}
                    >
                      Delete
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {isCreating ? (
        <CreateTermDrawerContainer
          articleId={articleId}
          sentence={detail.sentence}
          open
          onClose={() => setIsCreating(false)}
          onSaved={() =>
            onFeedback({
              severity: 'success',
              message: 'Contextual term added.',
            })
          }
        />
      ) : null}
    </Stack>
  )
}

interface SelectedSentencePanelProps {
  articleId: string
  detail: ArticleSentenceDetail
  isReadOnly: boolean
  onEditTerm: (termId: string) => void
  onDeleteTerm: (term: ArticleSentenceTerm) => void
  onFeedback: (feedback: Feedback) => void
}

function SelectedSentencePanel({
  articleId,
  detail,
  isReadOnly,
  onEditTerm,
  onDeleteTerm,
  onFeedback,
}: SelectedSentencePanelProps) {
  const mutation = useUpdateAdminArticleSentenceMutation(
    articleId,
    detail.sentence.id,
  )

  const submit = async (request: UpdateArticleSentenceRequest) => {
    await mutation.mutateAsync(request)
    onFeedback({
      severity: 'success',
      message: 'Sentence metadata updated.',
    })
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          color="text.secondary"
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
          }}
        >
          Sentence {detail.sentence.sentenceOrder}
        </Typography>
        <Typography variant="h2" sx={{ mt: 0.5, fontSize: 27 }}>
          Sentence detail
        </Typography>
      </Box>
      <ArticleSentenceEditor
        sentence={detail.sentence}
        isPending={mutation.isPending}
        isReadOnly={isReadOnly}
        serverError={mutation.isError ? apiMessage(mutation.error) : null}
        onSubmit={submit}
      />
      <Divider />
      <SentenceTerms
        articleId={articleId}
        detail={detail}
        isReadOnly={isReadOnly}
        onEditTerm={onEditTerm}
        onDeleteTerm={onDeleteTerm}
        onFeedback={onFeedback}
      />
    </Stack>
  )
}

interface TermDeleteDialogProps {
  articleId: string
  term: ArticleSentenceTerm | null
  onClose: () => void
  onDeleted: () => void
  onUpdated: (message: string) => void
}

function TermDeleteDialog({
  articleId,
  term,
  onClose,
  onDeleted,
  onUpdated,
}: TermDeleteDialogProps) {
  const deleteMutation = useDeleteAdminArticleTermMutation(articleId)
  const updateMutation = useUpdateAdminArticleTermMutation(
    articleId,
    term?.id ?? '',
  )
  const deleteError = deleteMutation.isError
    ? normalizeApiError(deleteMutation.error)
    : null
  const isReferencedConflict = deleteError?.status === 409

  const close = () => {
    if (deleteMutation.isPending || updateMutation.isPending) return
    deleteMutation.reset()
    updateMutation.reset()
    onClose()
  }

  const remove = () => {
    if (!term) return
    deleteMutation.mutate(term.id, {
      onSuccess: () => {
        onDeleted()
        close()
      },
    })
  }

  const applyAlternative = (request: UpdateArticleTermRequest) => {
    updateMutation.mutate(request, {
      onSuccess: () => {
        onUpdated(
          'The referenced term was preserved and removed from active lookup.',
        )
        close()
      },
    })
  }

  return (
    <Dialog
      open={Boolean(term)}
      onClose={close}
      aria-labelledby="delete-term-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="delete-term-title">Delete contextual term</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {term
            ? `Delete “${term.wordDisplay ?? term.value}” and unwrap its backend marker?`
            : ''}
        </DialogContentText>
        {deleteError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {apiMessage(deleteError)}
          </Alert>
        ) : null}
        {isReferencedConflict ? (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>
              Preserve referenced learning data:
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ mt: 1.25 }}
            >
              <Button
                variant="outlined"
                onClick={() => applyAlternative({ isActive: false })}
                disabled={updateMutation.isPending}
              >
                Deactivate term
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  applyAlternative({ isLookupEnabled: false })
                }
                disabled={updateMutation.isPending}
              >
                Disable lookup
              </Button>
            </Stack>
          </Box>
        ) : null}
        {updateMutation.isError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {apiMessage(updateMutation.error)}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={deleteMutation.isPending}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={remove}
          disabled={deleteMutation.isPending || isReferencedConflict}
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete term'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

type LifecycleAction = 'publish' | 'archive' | 'restore'

interface LifecycleDialogProps {
  action: LifecycleAction | null
  issues: PublicationValidationIssue[]
  errorMessage: string | null
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

function LifecycleDialog({
  action,
  issues,
  errorMessage,
  isPending,
  onClose,
  onConfirm,
}: LifecycleDialogProps) {
  const labels = {
    publish: {
      title: 'Publish article',
      description:
        'Run the backend publication checklist and make this article available to readers.',
      confirm: 'Publish',
    },
    archive: {
      title: 'Archive article',
      description:
        'Hide this article while preserving content, progress, vocabulary, and history.',
      confirm: 'Archive',
    },
    restore: {
      title: 'Restore article to draft',
      description:
        'Return this archived article to draft so it can be validated and published again.',
      confirm: 'Restore to draft',
    },
  } as const
  const copy = action ? labels[action] : labels.publish

  return (
    <Dialog
      open={Boolean(action)}
      onClose={isPending ? undefined : onClose}
      aria-labelledby="lifecycle-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="lifecycle-dialog-title">{copy.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{copy.description}</DialogContentText>
        {errorMessage ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}
        {issues.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 750 }}>
              Resolve these publication checks:
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, mb: 0 }}>
              {issues.map((issue) => (
                <Box component="li" key={`${issue.code}:${issue.entityId ?? ''}`}>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>
                    {issue.message}
                    {issue.entityId ? ` (${issue.entityId})` : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={isPending || issues.length > 0}
        >
          {isPending ? 'Saving…' : copy.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function AdminArticleContentPage() {
  const { articleId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'terms' ? 'terms' : 'sentences'
  const selectedSentenceId = searchParams.get('sentenceId') ?? ''
  const sentenceParams = {
    page: positiveInteger(searchParams.get('page'), 1),
    limit: positiveInteger(searchParams.get('limit'), 20, 100),
    ...(optionalBoolean(searchParams.get('isActive')) === undefined
      ? {}
      : { isActive: optionalBoolean(searchParams.get('isActive')) }),
  }
  const termQ = searchParams.get('termQ')?.trim()
  const termCefr = CEFR_LEVELS.find(
    (level) => level === searchParams.get('termCefr'),
  )
  const termUnit = LEXICAL_UNIT_TYPES.find(
    (unitType) => unitType === searchParams.get('termUnit'),
  )
  const termOrigin = TERM_ORIGINS.find(
    (origin) => origin === searchParams.get('termOrigin'),
  )
  const termReview = TERM_REVIEW_STATUSES.find(
    (status) => status === searchParams.get('termReview'),
  )
  const termExplanation = AI_GENERATION_STATUSES.find(
    (status) => status === searchParams.get('termExplanation'),
  )
  const termParams = {
    page: positiveInteger(searchParams.get('termPage'), 1),
    limit: positiveInteger(searchParams.get('termLimit'), 20, 100),
    ...(termQ ? { q: termQ } : {}),
    ...(termCefr ? { cefrLevel: termCefr } : {}),
    ...(termUnit ? { unitType: termUnit } : {}),
    ...(termOrigin ? { origin: termOrigin } : {}),
    ...(termReview ? { reviewStatus: termReview } : {}),
    ...(termExplanation
      ? { explanationStatus: termExplanation }
      : {}),
    ...(optionalBoolean(searchParams.get('termActive')) === undefined
      ? {}
      : {
          isActive: optionalBoolean(searchParams.get('termActive')),
        }),
  }

  const detailQuery = useAdminArticleDetailQuery(articleId)
  const sentenceListQuery = useAdminArticleSentenceListQuery(
    articleId,
    sentenceParams,
  )
  const sentenceDetailQuery = useAdminArticleSentenceDetailQuery(
    articleId,
    selectedSentenceId,
  )
  const termListQuery = useAdminArticleTermListQuery(articleId, termParams)
  const parseMutation = useParseAdminArticleContentMutation(articleId)
  const analyzeMutation = useAnalyzeAdminArticleMutation(articleId)
  const approveTermMutation =
    useApproveAdminArticleTermMutation(articleId)
  const rejectTermMutation =
    useRejectAdminArticleTermMutation(articleId)
  const publishMutation = usePublishAdminArticleMutation(articleId)
  const archiveMutation = useArchiveAdminArticleMutation(articleId)
  const restoreMutation = useRestoreAdminArticleDraftMutation(articleId)

  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [forceParseOpen, setForceParseOpen] = useState(false)
  const [forceParseAttempted, setForceParseAttempted] = useState(false)
  const [editTermId, setEditTermId] = useState<string | null>(null)
  const [deleteTerm, setDeleteTerm] =
    useState<ArticleSentenceTerm | null>(null)
  const [lifecycleAction, setLifecycleAction] =
    useState<LifecycleAction | null>(null)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [moderationTarget, setModerationTarget] =
    useState<ModerationTarget | null>(null)

  const updateParams = (
    updates: Record<string, string | undefined>,
    resetKey?: string,
  ) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      if (resetKey) next.set(resetKey, '1')
      return next
    })
  }

  const runParse = (force = false) => {
    setFeedback(null)
    setForceParseAttempted(force)
    parseMutation.reset()
    parseMutation.mutate(force ? { force: true } : {}, {
      onSuccess: (data) => {
        setForceParseOpen(false)
        updateParams({ sentenceId: undefined, page: '1' })
        setFeedback({
          severity: 'success',
          message: `${data.sentenceCount} sentences parsed for content version ${data.contentVersion}.`,
        })
      },
      onError: (error) => {
        const apiError = normalizeApiError(error)
        if (
          !force &&
          apiError.status === 409 &&
          apiError.message.toLowerCase().includes('already been parsed')
        ) {
          setForceParseAttempted(false)
          setForceParseOpen(true)
          return
        }
        setFeedback({
          severity: apiError.status === 422 ? 'warning' : 'error',
          message: apiMessage(apiError),
        })
      },
    })
  }

  const openLifecycle = (action: LifecycleAction) => {
    publishMutation.reset()
    archiveMutation.reset()
    restoreMutation.reset()
    setLifecycleAction(action)
  }

  const runAnalysis = () => {
    analyzeMutation.mutate(undefined, {
      onSuccess: (data) => {
        setAnalysisOpen(false)
        updateParams({
          tab: 'terms',
          termOrigin: 'NLP',
          termReview: 'APPROVED',
          termPage: '1',
        })
        setFeedback({
          severity: 'success',
          message: `Vocabulary analysis created ${data.candidateCount} terms and set article CEFR to ${data.cefrLevel} for content version ${data.contentVersion}.`,
        })
      },
      onError: (error) => {
        setFeedback({
          severity: 'error',
          message: apiMessage(error),
        })
        setAnalysisOpen(false)
      },
    })
  }

  const runModeration = () => {
    if (!moderationTarget) return
    const mutation =
      moderationTarget.action === 'approve'
        ? approveTermMutation
        : rejectTermMutation

    mutation.mutate(moderationTarget.term.id, {
      onSuccess: () => {
        const actionLabel =
          moderationTarget.action === 'approve' ? 'approved' : 'rejected'
        setFeedback({
          severity: 'success',
          message: `${moderationTarget.term.wordDisplay ?? moderationTarget.term.value} ${actionLabel}.`,
        })
        setModerationTarget(null)
      },
    })
  }

  const activeLifecycleMutation =
    lifecycleAction === 'publish'
      ? publishMutation
      : lifecycleAction === 'archive'
        ? archiveMutation
        : restoreMutation
  const lifecycleError = activeLifecycleMutation.isError
    ? normalizeApiError(activeLifecycleMutation.error)
    : null
  const lifecycleIssues = lifecycleError?.issues ?? []

  const confirmLifecycle = () => {
    const onSuccess = () => {
      const message =
        lifecycleAction === 'publish'
          ? 'Article published.'
          : lifecycleAction === 'archive'
            ? 'Article archived.'
            : 'Article restored to draft.'
      setFeedback({ severity: 'success', message })
      setLifecycleAction(null)
    }

    if (lifecycleAction === 'publish') {
      publishMutation.mutate(undefined, { onSuccess })
    } else if (lifecycleAction === 'archive') {
      archiveMutation.mutate(undefined, { onSuccess })
    } else if (lifecycleAction === 'restore') {
      restoreMutation.mutate(undefined, { onSuccess })
    }
  }

  const heading = (
    <Stack spacing={1}>
      <Typography
        variant="h1"
        sx={{ fontSize: { xs: 34, md: 46 }, textWrap: 'balance' }}
      >
        Article content
      </Typography>
    </Stack>
  )

  if (detailQuery.isPending) {
    return (
      <Stack spacing={3.5}>
        {heading}
        <Paper
          variant="outlined"
          sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">
              Loading article workspace…
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    )
  }

  if (detailQuery.isError) {
    return (
      <Stack spacing={3.5}>
        {heading}
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => detailQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {apiMessage(detailQuery.error)}
        </Alert>
      </Stack>
    )
  }

  const { article, sentenceCount, termCount } = detailQuery.data
  const isReadOnly = article.status === 'ARCHIVED'
  const canAnalyze =
    article.status === 'DRAFT' &&
    (article.aiAnalysisStatus === 'PENDING' ||
      article.aiAnalysisStatus === 'FAILED')

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { lg: 'flex-end' } }}
      >
        <Box>
          {heading}
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {article.title}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {article.status !== 'ARCHIVED' ? (
            <Button
              component={RouterLink}
              to={adminArticlePreviewPath(article.id)}
              variant="outlined"
            >
              Preview
            </Button>
          ) : null}
          {article.status !== 'ARCHIVED' ? (
            <Button
              component={RouterLink}
              to={adminArticleEditPath(article.id)}
              variant="outlined"
            >
              Edit HTML
            </Button>
          ) : null}
          <Button
            component={RouterLink}
            to={routePaths.adminArticles}
            color="inherit"
          >
            Back to articles
          </Button>
        </Stack>
      </Stack>

      {feedback ? (
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, md: 3 },
          borderLeft: 4,
          borderLeftColor: 'primary.main',
        }}
      >
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
          >
            <ArticleClassification
              status={article.status}
              cefrLevel={article.cefrLevel}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {article.status !== 'ARCHIVED' ? (
                <Button
                  variant="outlined"
                  onClick={() => runParse(false)}
                  disabled={parseMutation.isPending}
                >
                  {parseMutation.isPending
                    ? 'Parsing…'
                    : 'Parse current content'}
                </Button>
              ) : null}
              {canAnalyze ? (
                <Button
                  variant="outlined"
                  onClick={() => {
                    analyzeMutation.reset()
                    setAnalysisOpen(true)
                  }}
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending
                    ? 'Analyzing…'
                    : article.aiAnalysisStatus === 'FAILED'
                      ? 'Retry analysis'
                      : 'Analyze vocabulary'}
                </Button>
              ) : null}
              {article.status === 'DRAFT' ? (
                <Button
                  variant="contained"
                  onClick={() => openLifecycle('publish')}
                >
                  Publish
                </Button>
              ) : null}
              {article.status === 'DRAFT' ||
              article.status === 'PUBLISHED' ? (
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={() => openLifecycle('archive')}
                >
                  Archive
                </Button>
              ) : null}
              {article.status === 'ARCHIVED' ? (
                <Button
                  variant="contained"
                  onClick={() => openLifecycle('restore')}
                >
                  Restore to draft
                </Button>
              ) : null}
            </Stack>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(120px, 1fr))',
              },
              gap: 2.5,
            }}
          >
            <SummaryValue
              label="Content version"
              value={`v${article.contentVersion}`}
            />
            <SummaryValue label="Sentences" value={sentenceCount} />
            <SummaryValue label="Terms" value={termCount} />
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: { sm: 'center' } }}
          >
            <Typography color="text.secondary" variant="body2">
              Vocabulary analysis
            </Typography>
            <Chip
              size="small"
              label={article.aiAnalysisStatus ?? 'Not run'}
              color={
                article.aiAnalysisStatus === 'READY'
                  ? 'success'
                  : article.aiAnalysisStatus === 'FAILED'
                    ? 'error'
                    : 'default'
              }
              variant="outlined"
            />
            {article.aiAnalysisStatus === 'FAILED' &&
            article.aiAnalysisError ? (
              <Typography color="error" variant="body2">
                {article.aiAnalysisError}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, value: 'sentences' | 'terms') =>
            updateParams({ tab: value === 'sentences' ? undefined : value })
          }
          aria-label="Article content sections"
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="sentences" label="Sentences" />
          <Tab value="terms" label="All terms" />
        </Tabs>

        {tab === 'sentences' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
              minHeight: 620,
            }}
          >
            <Box
              component="aside"
              aria-label="Ordered sentences"
              sx={{
                borderRight: { lg: 1 },
                borderBottom: { xs: 1, lg: 0 },
                borderColor: 'divider',
                minWidth: 0,
              }}
            >
              <Box sx={{ p: 2 }}>
                <TextField
                  select
                  label="Sentence status"
                  value={
                    sentenceParams.isActive === undefined
                      ? ''
                      : String(sentenceParams.isActive)
                  }
                  onChange={(event) =>
                    updateParams(
                      {
                        isActive: event.target.value || undefined,
                        sentenceId: undefined,
                      },
                      'page',
                    )
                  }
                >
                  <MenuItem value="">All sentences</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </TextField>
              </Box>
              {sentenceListQuery.isFetching ? (
                <LinearProgress aria-label="Refreshing sentences" />
              ) : (
                <Box sx={{ height: 4 }} />
              )}
              {sentenceListQuery.isPending ? (
                <Stack
                  role="status"
                  spacing={1.25}
                  sx={{ alignItems: 'center', py: 8 }}
                >
                  <CircularProgress size={28} />
                  <Typography color="text.secondary">
                    Loading sentences…
                  </Typography>
                </Stack>
              ) : sentenceListQuery.isError ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  {apiMessage(sentenceListQuery.error)}
                </Alert>
              ) : sentenceListQuery.data.items.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography sx={{ fontWeight: 750 }}>
                    No parsed sentences
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    Parse the current article HTML to create the ordered
                    sentence set.
                  </Typography>
                </Box>
              ) : (
                <>
                  <List disablePadding>
                    {sentenceListQuery.data.items.map((sentence) => (
                      <ListItemButton
                        key={sentence.id}
                        selected={sentence.id === selectedSentenceId}
                        onClick={() =>
                          updateParams({ sentenceId: sentence.id })
                        }
                        sx={{
                          alignItems: 'flex-start',
                          py: 1.75,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: 'primary.main',
                                }}
                              >
                                {sentence.sentenceOrder}
                              </Typography>
                              {!sentence.isActive ? (
                                <Chip label="Inactive" size="small" />
                              ) : null}
                            </Stack>
                          }
                          secondary={sentence.sentenceText}
                          slotProps={{
                            secondary: {
                              sx: {
                                mt: 0.75,
                                color: 'text.primary',
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 3,
                              },
                            },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                  <TablePagination
                    component="div"
                    count={sentenceListQuery.data.meta.total}
                    page={Math.max(
                      0,
                      sentenceListQuery.data.meta.page - 1,
                    )}
                    rowsPerPage={sentenceListQuery.data.meta.limit}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={(_, page) =>
                      updateParams({
                        page: String(page + 1),
                        sentenceId: undefined,
                      })
                    }
                    onRowsPerPageChange={(event) =>
                      updateParams(
                        {
                          limit: event.target.value,
                          sentenceId: undefined,
                        },
                        'page',
                      )
                    }
                  />
                </>
              )}
            </Box>

            <Box sx={{ p: { xs: 2.5, md: 3.5 }, minWidth: 0 }}>
              {!selectedSentenceId ? (
                <Stack
                  spacing={1}
                  sx={{ alignItems: 'flex-start', py: { xs: 3, md: 8 } }}
                >
                  <Typography variant="h2" sx={{ fontSize: 27 }}>
                    Select a sentence
                  </Typography>
                  <Typography color="text.secondary">
                    Choose an ordered sentence to edit its learning metadata
                    and contextual terms.
                  </Typography>
                </Stack>
              ) : sentenceDetailQuery.isPending ? (
                <Stack
                  role="status"
                  spacing={1.5}
                  sx={{ alignItems: 'center', py: 8 }}
                >
                  <CircularProgress size={30} />
                  <Typography color="text.secondary">
                    Loading sentence detail…
                  </Typography>
                </Stack>
              ) : sentenceDetailQuery.isError ? (
                <Alert severity="error">
                  {apiMessage(sentenceDetailQuery.error)}
                </Alert>
              ) : (
                <SelectedSentencePanel
                  articleId={articleId}
                  detail={sentenceDetailQuery.data}
                  isReadOnly={isReadOnly}
                  onEditTerm={setEditTermId}
                  onDeleteTerm={setDeleteTerm}
                  onFeedback={setFeedback}
                />
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'minmax(260px, 1.5fr) repeat(3, minmax(150px, 1fr))',
                  },
                  gap: 1.5,
                }}
              >
                <DebouncedSearchField
                  key={termQ ?? ''}
                  initialValue={termQ ?? ''}
                  label="Search terms"
                  placeholder="Search value or lemma…"
                  onCommit={(q) =>
                    updateParams(
                      { termQ: q || undefined },
                      'termPage',
                    )
                  }
                />
                <TextField
                  select
                  label="CEFR level"
                  value={termCefr ?? ''}
                  onChange={(event) =>
                    updateParams(
                      { termCefr: event.target.value || undefined },
                      'termPage',
                    )
                  }
                >
                  <MenuItem value="">All CEFR levels</MenuItem>
                  {CEFR_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Origin"
                  value={termOrigin ?? ''}
                  onChange={(event) =>
                    updateParams(
                      { termOrigin: event.target.value || undefined },
                      'termPage',
                    )
                  }
                >
                  <MenuItem value="">All origins</MenuItem>
                  <MenuItem value="MANUAL">Manual</MenuItem>
                  <MenuItem value="AI">AI candidate</MenuItem>
                  <MenuItem value="NLP">WinkNLP</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Review"
                  value={termReview ?? ''}
                  onChange={(event) =>
                    updateParams(
                      { termReview: event.target.value || undefined },
                      'termPage',
                    )
                  }
                >
                  <MenuItem value="">All review states</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Enrichment"
                  value={termExplanation ?? ''}
                  onChange={(event) =>
                    updateParams(
                      {
                        termExplanation:
                          event.target.value || undefined,
                      },
                      'termPage',
                    )
                  }
                >
                  <MenuItem value="">All enrichment states</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PROCESSING">Processing</MenuItem>
                  <MenuItem value="READY">Ready</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Unit type"
                  value={termUnit ?? ''}
                  onChange={(event) =>
                    updateParams(
                      { termUnit: event.target.value || undefined },
                      'termPage',
                    )
                  }
                >
                  <MenuItem value="">All unit types</MenuItem>
                  <MenuItem value="WORD">Word</MenuItem>
                  <MenuItem value="PHRASE">Phrase</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Status"
                  value={
                    termParams.isActive === undefined
                      ? ''
                      : String(termParams.isActive)
                  }
                  onChange={(event) =>
                    updateParams(
                      { termActive: event.target.value || undefined },
                      'termPage',
                    )
                  }
                >
                  <MenuItem value="">All terms</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </TextField>
              </Box>

              {termListQuery.isFetching ? (
                <LinearProgress aria-label="Refreshing terms" />
              ) : null}
              {termListQuery.isPending ? (
                <Stack
                  role="status"
                  spacing={1.5}
                  sx={{ alignItems: 'center', py: 8 }}
                >
                  <CircularProgress size={30} />
                  <Typography color="text.secondary">
                    Loading contextual terms…
                  </Typography>
                </Stack>
              ) : termListQuery.isError ? (
                <Alert severity="error">
                  {apiMessage(termListQuery.error)}
                </Alert>
              ) : termListQuery.data.items.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4 }}>
                  <Typography variant="h2" sx={{ fontSize: 25 }}>
                    No matching terms
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    Add terms from a selected sentence or change these
                    filters.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1}>
                  {termListQuery.data.items.map(
                    (term: ArticleTermListItem) => (
                      <Paper key={term.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          sx={{ justifyContent: 'space-between' }}
                        >
                          <Box>
                            <Stack
                              direction="row"
                              spacing={0.75}
                              sx={{ flexWrap: 'wrap', gap: 0.75 }}
                            >
                              <Typography sx={{ fontWeight: 750 }}>
                                {term.wordDisplay ?? term.value}
                              </Typography>
                              <Chip
                                label={`Sentence ${term.sentenceOrder}`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={term.cefrLevel ?? 'CEFR pending'}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={
                                  term.origin === 'AI'
                                    ? 'AI'
                                    : term.origin === 'NLP'
                                      ? 'WinkNLP'
                                      : 'Manual'
                                }
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={term.reviewStatus}
                                size="small"
                                color={
                                  term.reviewStatus === 'APPROVED'
                                    ? 'success'
                                    : term.reviewStatus === 'REJECTED'
                                      ? 'error'
                                      : 'warning'
                                }
                                variant="outlined"
                              />
                              {!term.isActive ? (
                                <Chip label="Inactive" size="small" />
                              ) : null}
                            </Stack>
                            <Typography
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {term.contextualMeaningVi ??
                                'Enrichment will be generated after approval and reader lookup.'}
                            </Typography>
                            {term.selectionReason ? (
                              <Typography
                                color="text.secondary"
                                variant="body2"
                                sx={{ mt: 0.75 }}
                              >
                                Selection reason: {term.selectionReason}
                              </Typography>
                            ) : null}
                          </Box>
                          {!isReadOnly ? (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}
                            >
                              {article.status === 'DRAFT' &&
                              term.origin === 'AI' &&
                              term.reviewStatus === 'PENDING' ? (
                                <>
                                  <Button
                                    size="small"
                                    color="success"
                                    onClick={() =>
                                      setModerationTarget({
                                        term,
                                        action: 'approve',
                                      })
                                    }
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      setModerationTarget({
                                        term,
                                        action: 'reject',
                                      })
                                    }
                                  >
                                    Reject
                                  </Button>
                                </>
                              ) : null}
                              <Button
                                size="small"
                                onClick={() => setEditTermId(term.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => setDeleteTerm(term)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          ) : null}
                        </Stack>
                      </Paper>
                    ),
                  )}
                  <TablePagination
                    component="div"
                    count={termListQuery.data.meta.total}
                    page={Math.max(0, termListQuery.data.meta.page - 1)}
                    rowsPerPage={termListQuery.data.meta.limit}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={(_, page) =>
                      updateParams({ termPage: String(page + 1) })
                    }
                    onRowsPerPageChange={(event) =>
                      updateParams(
                        { termLimit: event.target.value },
                        'termPage',
                      )
                    }
                  />
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      <ConfirmationDialog
        open={forceParseOpen}
        title="Force parse current content"
        description="This content version is already parsed. Force parsing replaces its sentence and term set and may fail when existing learning references must be preserved."
        confirmLabel="Force parse"
        isPending={parseMutation.isPending}
        errorMessage={
          forceParseAttempted && parseMutation.isError
            ? apiMessage(parseMutation.error)
            : null
        }
        onCancel={() => {
          setForceParseOpen(false)
          setForceParseAttempted(false)
        }}
        onConfirm={() => runParse(true)}
      />

      <LifecycleDialog
        action={lifecycleAction}
        issues={lifecycleIssues}
        errorMessage={lifecycleError ? apiMessage(lifecycleError) : null}
        isPending={activeLifecycleMutation.isPending}
        onClose={() => setLifecycleAction(null)}
        onConfirm={confirmLifecycle}
      />

      <ConfirmationDialog
        open={analysisOpen}
        title={
          article.aiAnalysisStatus === 'FAILED'
            ? 'Retry draft analysis'
            : 'Analyze this draft'
        }
        description="This tokenizes every current sentence locally with WinkNLP, uses cefr-analyzer to set the article CEFR and classify known terms, leaves unknown term CEFR pending for lookup enrichment, and inserts one marker for each unique valid surface. It does not call an AI provider or publish the article."
        confirmLabel="Run analysis"
        isPending={analyzeMutation.isPending}
        errorMessage={
          analyzeMutation.isError
            ? apiMessage(analyzeMutation.error)
            : null
        }
        onCancel={() => setAnalysisOpen(false)}
        onConfirm={runAnalysis}
      />

      <ConfirmationDialog
        open={Boolean(moderationTarget)}
        title={
          moderationTarget?.action === 'approve'
            ? 'Approve AI candidate'
            : 'Reject AI candidate'
        }
        description={
          moderationTarget?.action === 'approve'
            ? `Approve “${moderationTarget.term.wordDisplay ?? moderationTarget.term.value}” and add its reader marker exactly once? Contextual enrichment remains lazy until a reader looks it up.`
            : `Reject “${moderationTarget?.term.wordDisplay ?? moderationTarget?.term.value ?? ''}”? Rejected terms remain inaccessible to readers.`
        }
        confirmLabel={
          moderationTarget?.action === 'approve' ? 'Approve' : 'Reject'
        }
        isPending={
          approveTermMutation.isPending || rejectTermMutation.isPending
        }
        errorMessage={
          approveTermMutation.isError
            ? apiMessage(approveTermMutation.error)
            : rejectTermMutation.isError
              ? apiMessage(rejectTermMutation.error)
              : null
        }
        onCancel={() => setModerationTarget(null)}
        onConfirm={runModeration}
      />

      <TermDeleteDialog
        articleId={articleId}
        term={deleteTerm}
        onClose={() => setDeleteTerm(null)}
        onDeleted={() =>
          setFeedback({
            severity: 'success',
            message: 'Contextual term deleted.',
          })
        }
        onUpdated={(message) =>
          setFeedback({ severity: 'success', message })
        }
      />

      {editTermId ? (
        <EditTermDrawerContainer
          articleId={articleId}
          termId={editTermId}
          onClose={() => setEditTermId(null)}
          onSaved={() =>
            setFeedback({
              severity: 'success',
              message: 'Contextual term updated.',
            })
          }
        />
      ) : null}
    </Stack>
  )
}
