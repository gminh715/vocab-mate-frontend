import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import {
  Link as RouterLink,
  useLocation,
  useParams,
} from 'react-router-dom'
import { QuizOptionDialog } from '@/components/Admin/QuizOptionDialog'
import { QuizQuestionDialog } from '@/components/Admin/QuizQuestionDialog'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import { normalizeApiError } from '@/config/apiClient'
import {
  useAdminQuizDetailQuery,
  useArchiveAdminQuizMutation,
  useDeleteQuestionOptionMutation,
  useDeleteQuizQuestionMutation,
  usePublishAdminQuizMutation,
  useRestoreAdminQuizMutation,
  useUpdateAdminQuizMutation,
} from '@/hooks/Admin/useAdminQuizzes'
import { isOptionQuestion, toUpdateQuizRequest } from '@/schemas/Admin/adminQuiz'
import type {
  AdminQuestionOption,
  AdminQuizQuestion,
} from '@/types/Admin/adminQuizzes'
import { routePaths } from '@/utils/paths'

const questionTypeLabel = {
  SELECT_MEANING: 'Select meaning',
  SELECT_WORD: 'Select word',
  SELECT_CORRECT_CONTEXT: 'Select correct context',
  FILL_BLANK: 'Fill in the blank',
} as const

const errorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

interface NavigationState {
  feedback?: string
}

function QuestionCard({
  quizId,
  question,
  readOnly,
  onEdit,
  onDelete,
}: {
  quizId: string
  question: AdminQuizQuestion
  readOnly: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [optionDialog, setOptionDialog] = useState<
    AdminQuestionOption | 'new' | null
  >(null)
  const [deleteOption, setDeleteOption] =
    useState<AdminQuestionOption | null>(null)
  const deleteOptionMutation = useDeleteQuestionOptionMutation(
    quizId,
    question.id,
  )
  const orderedOptions = [...question.options].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  )
  const nextOptionOrder =
    orderedOptions.reduce(
      (largest, option) => Math.max(largest, option.displayOrder),
      0,
    ) + 1

  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderLeft: 4,
        borderLeftColor: question.isActive ? 'primary.main' : 'divider',
      }}
    >
      <Stack spacing={2.25} sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between' }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip size="small" label={`Order ${question.displayOrder}`} />
              <Chip
                size="small"
                color="secondary"
                variant="outlined"
                label={questionTypeLabel[question.questionType]}
              />
              <Chip size="small" label={`${question.points} pt${question.points === 1 ? '' : 's'}`} />
              {!question.isActive ? <Chip size="small" label="Inactive" /> : null}
            </Stack>
            <Typography variant="h2" sx={{ fontSize: 23 }}>
              {question.prompt}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              Contextual term ID: {question.articleVocabularyId}
            </Typography>
          </Stack>
          {!readOnly ? (
            <Stack direction="row" spacing={0.5} sx={{ alignSelf: { sm: 'flex-start' } }}>
              <Button size="small" onClick={onEdit}>Edit</Button>
              <Button size="small" color="error" onClick={onDelete}>Delete</Button>
            </Stack>
          ) : null}
        </Stack>

        {question.questionType === 'FILL_BLANK' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              p: 2,
              bgcolor: 'primary.light',
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography variant="overline">Blank sentence</Typography>
              <Typography>{question.blankSentence || 'Not set'}</Typography>
            </Box>
            <Box>
              <Typography variant="overline">Correct answer</Typography>
              <Typography sx={{ fontWeight: 800 }}>
                {question.correctAnswerText || 'Not set'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {question.isCaseSensitive ? 'Case-sensitive' : 'Case-insensitive'}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800 }}>
                Answer options ({orderedOptions.length})
              </Typography>
              {!readOnly ? (
                <Button size="small" variant="outlined" onClick={() => setOptionDialog('new')}>
                  Add option
                </Button>
              ) : null}
            </Stack>
            {orderedOptions.length === 0 ? (
              <Alert severity="warning">
                Add answer options before publishing this question.
              </Alert>
            ) : (
              <Stack spacing={1}>
                {orderedOptions.map((option) => (
                  <Box
                    key={option.id}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'center',
                      p: 1.5,
                      border: 1,
                      borderColor: option.isCorrect ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: option.isCorrect ? 'primary.light' : 'background.paper',
                    }}
                  >
                    <Typography sx={{ width: 28, fontWeight: 800 }}>
                      {option.displayOrder}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: option.isCorrect ? 800 : 500 }}>
                        {option.optionText}
                      </Typography>
                      {option.explanation ? (
                        <Typography variant="body2" color="text.secondary">
                          {option.explanation}
                        </Typography>
                      ) : null}
                    </Box>
                    {option.isCorrect ? (
                      <Chip size="small" color="success" label="Correct" />
                    ) : null}
                    {!readOnly ? (
                      <>
                        <Button size="small" onClick={() => setOptionDialog(option)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => setDeleteOption(option)}>
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {question.answerExplanation ? (
          <>
            <Divider />
            <Box>
              <Typography variant="overline">Answer explanation</Typography>
              <Typography color="text.secondary">{question.answerExplanation}</Typography>
            </Box>
          </>
        ) : null}
      </Stack>

      {isOptionQuestion(question.questionType) && optionDialog ? (
        <QuizOptionDialog
          open
          quizId={quizId}
          questionId={question.id}
          option={optionDialog === 'new' ? null : optionDialog}
          nextDisplayOrder={nextOptionOrder}
          onClose={() => setOptionDialog(null)}
        />
      ) : null}
      <ConfirmationDialog
        open={Boolean(deleteOption)}
        title="Delete answer option"
        description="Permanently delete this option? Review history can block deletion."
        confirmLabel="Delete option"
        isPending={deleteOptionMutation.isPending}
        errorMessage={deleteOptionMutation.isError ? errorMessage(deleteOptionMutation.error) : null}
        onCancel={() => setDeleteOption(null)}
        onConfirm={() => {
          if (!deleteOption) return
          deleteOptionMutation.mutate(deleteOption.id, {
            onSuccess: () => setDeleteOption(null),
          })
        }}
      />
    </Paper>
  )
}

export function AdminQuizBuilderPage() {
  const { quizId = '' } = useParams()
  const location = useLocation()
  const initialFeedback = (location.state as NavigationState | null)?.feedback
  const [feedback, setFeedback] = useState<string | null>(initialFeedback ?? null)
  const [editingQuestion, setEditingQuestion] = useState<
    AdminQuizQuestion | 'new' | null
  >(null)
  const [deleteQuestion, setDeleteQuestion] =
    useState<AdminQuizQuestion | null>(null)
  const [lifecycle, setLifecycle] = useState<
    'publish' | 'archive' | 'restore' | null
  >(null)
  const detailQuery = useAdminQuizDetailQuery(quizId)
  const updateMutation = useUpdateAdminQuizMutation(quizId)
  const deleteQuestionMutation = useDeleteQuizQuestionMutation(quizId)
  const publishMutation = usePublishAdminQuizMutation(quizId)
  const archiveMutation = useArchiveAdminQuizMutation(quizId)
  const restoreMutation = useRestoreAdminQuizMutation(quizId)
  const lifecycleMutation =
    lifecycle === 'publish'
      ? publishMutation
      : lifecycle === 'archive'
        ? archiveMutation
        : restoreMutation
  const [title, setTitle] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)

  if (detailQuery.isPending) {
    return (
      <Stack role="status" spacing={1.5} sx={{ minHeight: 320, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={34} />
        <Typography color="text.secondary">Loading quiz builder…</Typography>
      </Stack>
    )
  }

  if (detailQuery.isError) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" onClick={() => detailQuery.refetch()}>Try again</Button>}
      >
        {errorMessage(detailQuery.error)}
      </Alert>
    )
  }

  const { quiz, questions } = detailQuery.data
  const orderedQuestions = [...questions].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  )
  const nextQuestionOrder =
    orderedQuestions.reduce(
      (largest, question) => Math.max(largest, question.displayOrder),
      0,
    ) + 1
  const contentReadOnly = quiz.status !== 'DRAFT'
  const metadataReadOnly = quiz.status === 'ARCHIVED'
  const formTitle = title ?? quiz.title
  const formDescription = description ?? quiz.description ?? ''
  const publicationError = publishMutation.isError
    ? normalizeApiError(publishMutation.error)
    : null

  const saveMetadata = () => {
    updateMutation.mutate(
      toUpdateQuizRequest(formTitle, formDescription),
      {
        onSuccess: () => {
          setTitle(null)
          setDescription(null)
          setFeedback('Quiz details saved.')
        },
      },
    )
  }

  const lifecycleCopy = lifecycle
    ? {
        publish: {
          title: 'Publish quiz',
          description: 'Validate the article, terms, questions, and answer keys before publication.',
          label: 'Publish',
        },
        archive: {
          title: 'Archive quiz',
          description: 'Hide this quiz while preserving all questions and review history.',
          label: 'Archive',
        },
        restore: {
          title: 'Restore quiz to draft',
          description: 'Restore this unused archived quiz so it can be edited again.',
          label: 'Restore to draft',
        },
      }[lifecycle]
    : null

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}
      >
        <Stack spacing={1} sx={{ maxWidth: 820 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography
              sx={{
                color: 'primary.main',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Quiz builder
            </Typography>
            <Chip size="small" label={quiz.status} />
          </Stack>
          <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 46 } }}>
            {quiz.title}
          </Typography>
          <Typography color="text.secondary">
            {orderedQuestions.length} question{orderedQuestions.length === 1 ? '' : 's'} ·{' '}
            {orderedQuestions.reduce((total, question) => total + question.points, 0)} total points
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {quiz.status === 'DRAFT' ? (
            <>
              <Button variant="contained" onClick={() => setLifecycle('publish')}>Publish</Button>
              <Button variant="outlined" onClick={() => setLifecycle('archive')}>Archive</Button>
            </>
          ) : quiz.status === 'PUBLISHED' ? (
            <Button variant="outlined" onClick={() => setLifecycle('archive')}>Archive</Button>
          ) : (
            <Button variant="contained" onClick={() => setLifecycle('restore')}>Restore to draft</Button>
          )}
          <Button component={RouterLink} to={routePaths.adminQuizzes} color="inherit">
            Back to quizzes
          </Button>
        </Stack>
      </Stack>

      {feedback ? <Alert severity="success" onClose={() => setFeedback(null)}>{feedback}</Alert> : null}
      {publicationError ? (
        <Alert severity="error">
          <Typography sx={{ fontWeight: 800 }}>{publicationError.message}</Typography>
          {publicationError.issues?.length ? (
            <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
              {publicationError.issues.map((issue) => (
                <li key={`${issue.code}-${issue.entityId ?? 'quiz'}`}>
                  {issue.message}
                  {issue.entityId ? ` (record ${issue.entityId})` : ''}
                </li>
              ))}
            </Box>
          ) : null}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Fix each item in the builder, then publish again.
          </Typography>
        </Alert>
      ) : null}

      <Paper
        variant="outlined"
        sx={{ p: { xs: 2.5, sm: 3 }, borderLeft: 4, borderLeftColor: 'secondary.main' }}
      >
        <Stack spacing={2.25}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: 25 }}>Quiz details</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              The source article cannot be changed after the draft is created.
            </Typography>
          </Box>
          <TextField
            label="Title"
            value={formTitle}
            disabled={metadataReadOnly}
            onChange={(event) => setTitle(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />
          <TextField
            label="Description"
            multiline
            minRows={3}
            value={formDescription}
            disabled={metadataReadOnly}
            onChange={(event) => setDescription(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 2_000 } }}
          />
          {updateMutation.isError ? <Alert severity="error">{errorMessage(updateMutation.error)}</Alert> : null}
          {!metadataReadOnly ? (
            <Button
              variant="outlined"
              sx={{ alignSelf: 'flex-end' }}
              disabled={
                updateMutation.isPending ||
                !formTitle.trim() ||
                (title === null && description === null)
              }
              onClick={saveMetadata}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save details'}
            </Button>
          ) : null}
        </Stack>
      </Paper>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography variant="h2" sx={{ fontSize: 28 }}>Questions</Typography>
          <Typography color="text.secondary">
            Display order is backend-supported and must be unique.
          </Typography>
        </Box>
        {!contentReadOnly ? (
          <Button variant="contained" onClick={() => setEditingQuestion('new')}>
            Add question
          </Button>
        ) : null}
      </Stack>

      {orderedQuestions.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 25 }}>No questions yet</Typography>
            <Typography color="text.secondary">
              Add a question linked to an active contextual term from this article.
            </Typography>
            {!contentReadOnly ? (
              <Button variant="contained" onClick={() => setEditingQuestion('new')}>
                Add first question
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orderedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              quizId={quizId}
              question={question}
              readOnly={contentReadOnly}
              onEdit={() => setEditingQuestion(question)}
              onDelete={() => setDeleteQuestion(question)}
            />
          ))}
        </Stack>
      )}

      {editingQuestion ? (
        <QuizQuestionDialog
          open
          quizId={quizId}
          articleId={quiz.articleId}
          question={editingQuestion === 'new' ? null : editingQuestion}
          nextDisplayOrder={nextQuestionOrder}
          onClose={() => setEditingQuestion(null)}
        />
      ) : null}
      <ConfirmationDialog
        open={Boolean(deleteQuestion)}
        title="Delete question"
        description="Permanently delete this draft question and its unused options? Review answers can block deletion."
        confirmLabel="Delete question"
        isPending={deleteQuestionMutation.isPending}
        errorMessage={deleteQuestionMutation.isError ? errorMessage(deleteQuestionMutation.error) : null}
        onCancel={() => setDeleteQuestion(null)}
        onConfirm={() => {
          if (!deleteQuestion) return
          deleteQuestionMutation.mutate(deleteQuestion.id, {
            onSuccess: () => setDeleteQuestion(null),
          })
        }}
      />
      <ConfirmationDialog
        open={Boolean(lifecycle)}
        title={lifecycleCopy?.title ?? ''}
        description={lifecycleCopy?.description ?? ''}
        confirmLabel={lifecycleCopy?.label ?? 'Confirm'}
        isPending={lifecycleMutation.isPending}
        errorMessage={
          lifecycle !== 'publish' && lifecycleMutation.isError
            ? errorMessage(lifecycleMutation.error)
            : null
        }
        onCancel={() => setLifecycle(null)}
        onConfirm={() =>
          lifecycleMutation.mutate(undefined, {
            onSuccess: () => {
              setFeedback(
                lifecycle === 'publish'
                  ? 'Quiz published.'
                  : lifecycle === 'archive'
                    ? 'Quiz archived.'
                    : 'Quiz restored to draft.',
              )
              setLifecycle(null)
            },
            onError: () => {
              if (lifecycle === 'publish') setLifecycle(null)
            },
          })
        }
      />
    </Stack>
  )
}
