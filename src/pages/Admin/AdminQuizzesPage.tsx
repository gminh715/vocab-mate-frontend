import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import { DebouncedSearchField } from '@/components/Shared/DebouncedSearchField'
import { normalizeApiError } from '@/config/apiClient'
import { useAdminArticleListQuery } from '@/hooks/Admin/useAdminArticles'
import {
  useArchiveAdminQuizMutation,
  useDeleteAdminQuizMutation,
  usePublishAdminQuizMutation,
  useRestoreAdminQuizMutation,
  useAdminQuizListQuery,
} from '@/hooks/Admin/useAdminQuizzes'
import type {
  AdminQuizListItem,
  QuizStatus,
} from '@/types/Admin/adminQuizzes'
import { QUIZ_STATUSES } from '@/types/Admin/adminQuizzes'
import { adminQuizListParamsFromSearchParams } from '@/utils/Admin/adminQuizListParams'
import { adminQuizEditPath, routePaths } from '@/utils/paths'

const statusColor = (
  status: QuizStatus,
): 'default' | 'success' | 'warning' =>
  status === 'PUBLISHED'
    ? 'success'
    : status === 'ARCHIVED'
      ? 'default'
      : 'warning'

const errorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

const publicationErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  if (apiError.status !== 422 || !apiError.issues?.length) {
    return errorMessage(error)
  }

  return `${apiError.message}: ${apiError.issues
    .map((issue) => issue.message)
    .join(' ')} Fix these items in the builder, then publish again.`
}

type Action = 'publish' | 'archive' | 'restore' | 'delete'

export function AdminQuizzesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = adminQuizListParamsFromSearchParams(searchParams)
  const quizzesQuery = useAdminQuizListQuery(params)
  const [articleSearch, setArticleSearch] = useState('')
  const articlesQuery = useAdminArticleListQuery({
    page: 1,
    limit: 100,
    ...(articleSearch ? { q: articleSearch } : {}),
    sort: 'newest',
  })
  const [target, setTarget] = useState<{
    quiz: AdminQuizListItem
    action: Action
  } | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const publishMutation = usePublishAdminQuizMutation(target?.quiz.id ?? '')
  const archiveMutation = useArchiveAdminQuizMutation(target?.quiz.id ?? '')
  const restoreMutation = useRestoreAdminQuizMutation(target?.quiz.id ?? '')
  const deleteMutation = useDeleteAdminQuizMutation()
  const mutation =
    target?.action === 'publish'
      ? publishMutation
      : target?.action === 'archive'
        ? archiveMutation
        : target?.action === 'restore'
          ? restoreMutation
          : deleteMutation

  const updateParams = (
    updates: Record<string, string | undefined>,
    resetPage = true,
  ) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      if (resetPage) next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    const limit = searchParams.get('limit')
    setSearchParams(limit ? { limit } : {})
  }

  const confirmAction = () => {
    if (!target) return
    const options = {
      onSuccess: () => {
        setFeedback(
          target.action === 'delete'
            ? `${target.quiz.title} deleted.`
            : `${target.quiz.title} ${
                target.action === 'restore'
                  ? 'restored to draft'
                  : `${target.action}d`
              }.`,
        )
        setTarget(null)
      },
    }
    if (target.action === 'delete') {
      deleteMutation.mutate(target.quiz.id, options)
    } else if (target.action === 'publish') {
      publishMutation.mutate(undefined, options)
    } else if (target.action === 'archive') {
      archiveMutation.mutate(undefined, options)
    } else {
      restoreMutation.mutate(undefined, options)
    }
  }

  const hasFilters = Boolean(params.q || params.articleId || params.status)
  const data = quizzesQuery.data
  const actionCopy = target
    ? {
        publish: {
          title: 'Publish quiz',
          description:
            'Run the backend publication checklist and make this quiz available for review.',
          label: 'Publish',
        },
        archive: {
          title: 'Archive quiz',
          description:
            'Hide this quiz while preserving its questions and review history.',
          label: 'Archive',
        },
        restore: {
          title: 'Restore quiz to draft',
          description:
            'Return this unused archived quiz to draft so its content can be edited.',
          label: 'Restore to draft',
        },
        delete: {
          title: 'Delete draft quiz',
          description:
            'Permanently delete this draft. The backend will refuse deletion if it has review history.',
          label: 'Delete draft',
        },
      }[target.action]
    : null

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between' }}
      >
        <Stack spacing={1} sx={{ maxWidth: 760 }}>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Assessment studio
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
            Quizzes
          </Typography>
          <Typography color="text.secondary">
            Build article-linked checks, verify answer keys, and control the
            publication lifecycle.
          </Typography>
        </Stack>
        <Button component={RouterLink} to={routePaths.adminQuizNew} variant="contained">
          Create quiz
        </Button>
      </Stack>

      {feedback ? (
        <Alert severity="success" onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(220px, 1.4fr) repeat(3, minmax(170px, 1fr)) auto',
            },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <DebouncedSearchField
            key={params.q ?? ''}
            initialValue={params.q ?? ''}
            label="Search quizzes"
            placeholder="Search title or description…"
            onCommit={(q) => updateParams({ q: q || undefined })}
          />
          <DebouncedSearchField
            initialValue=""
            label="Find article options"
            placeholder="Search article titles…"
            onCommit={setArticleSearch}
          />
          <TextField
            select
            label="Article"
            value={params.articleId ?? ''}
            disabled={articlesQuery.isPending}
            onChange={(event) =>
              updateParams({ articleId: event.target.value || undefined })
            }
          >
            <MenuItem value="">All articles</MenuItem>
            {articlesQuery.data?.items.map((article) => (
              <MenuItem key={article.id} value={article.id}>
                {article.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={params.status ?? ''}
            onChange={(event) =>
              updateParams({ status: event.target.value || undefined })
            }
          >
            <MenuItem value="">All statuses</MenuItem>
            {QUIZ_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status[0] + status.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </TextField>
          {hasFilters ? (
            <Button color="inherit" onClick={clearFilters}>
              Clear
            </Button>
          ) : null}
        </Box>
      </Paper>

      {quizzesQuery.isPending ? (
        <Paper variant="outlined" sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}>
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading quizzes…</Typography>
          </Stack>
        </Paper>
      ) : quizzesQuery.isError ? (
        <Alert
          severity="error"
          action={<Button color="inherit" onClick={() => quizzesQuery.refetch()}>Try again</Button>}
        >
          {errorMessage(quizzesQuery.error)}
        </Alert>
      ) : data?.items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              {hasFilters ? 'No matching quizzes' : 'No quizzes yet'}
            </Typography>
            <Typography color="text.secondary">
              {hasFilters
                ? 'Change or clear the filters to broaden your search.'
                : 'Create the first draft and attach questions from an article’s contextual terms.'}
            </Typography>
            <Button
              variant={hasFilters ? 'outlined' : 'contained'}
              component={hasFilters ? 'button' : RouterLink}
              to={hasFilters ? undefined : routePaths.adminQuizNew}
              onClick={hasFilters ? clearFilters : undefined}
            >
              {hasFilters ? 'Clear filters' : 'Create quiz'}
            </Button>
          </Stack>
        </Paper>
      ) : data ? (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          {quizzesQuery.isFetching ? <LinearProgress /> : <Box sx={{ height: 4 }} />}
          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Quiz</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((quiz) => (
                  <TableRow key={quiz.id} hover>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography sx={{ fontWeight: 750 }}>{quiz.title}</Typography>
                      <Typography color="text.secondary" noWrap>
                        {quiz.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor(quiz.status)}
                        label={quiz.status}
                        variant={quiz.status === 'PUBLISHED' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{quiz.questionCount}</TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                        new Date(quiz.updatedAt),
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
                        <Button component={RouterLink} to={adminQuizEditPath(quiz.id)} size="small">
                          {quiz.status === 'DRAFT' ? 'Build' : 'View'}
                        </Button>
                        {quiz.status === 'DRAFT' ? (
                          <>
                            <Button size="small" onClick={() => setTarget({ quiz, action: 'publish' })}>
                              Publish
                            </Button>
                            <Button size="small" onClick={() => setTarget({ quiz, action: 'archive' })}>
                              Archive
                            </Button>
                            <Button size="small" color="error" onClick={() => setTarget({ quiz, action: 'delete' })}>
                              Delete
                            </Button>
                          </>
                        ) : quiz.status === 'PUBLISHED' ? (
                          <Button size="small" onClick={() => setTarget({ quiz, action: 'archive' })}>
                            Archive
                          </Button>
                        ) : (
                          <Button size="small" onClick={() => setTarget({ quiz, action: 'restore' })}>
                            Restore
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data.meta.total}
            page={Math.max(0, data.meta.page - 1)}
            rowsPerPage={data.meta.limit}
            rowsPerPageOptions={[10, 20, 50, 100]}
            onPageChange={(_, page) => updateParams({ page: String(page + 1) }, false)}
            onRowsPerPageChange={(event) => updateParams({ limit: event.target.value })}
          />
        </Paper>
      ) : null}

      <ConfirmationDialog
        open={Boolean(target)}
        title={actionCopy?.title ?? ''}
        description={actionCopy?.description ?? ''}
        confirmLabel={actionCopy?.label ?? 'Confirm'}
        isPending={mutation.isPending}
        errorMessage={
          mutation.isError
            ? target?.action === 'publish'
              ? publicationErrorMessage(mutation.error)
              : errorMessage(mutation.error)
            : null
        }
        onCancel={() => setTarget(null)}
        onConfirm={confirmAction}
      />
    </Stack>
  )
}
