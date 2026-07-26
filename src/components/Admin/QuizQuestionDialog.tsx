import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { DebouncedSearchField } from '@/components/Shared/DebouncedSearchField'
import { useAdminArticleTermListQuery } from '@/hooks/Admin/useAdminArticleContent'
import {
  useCreateQuizQuestionMutation,
  useUpdateQuizQuestionMutation,
} from '@/hooks/Admin/useAdminQuizzes'
import {
  questionFormSchema,
  toQuestionRequest,
  type QuestionFormOutput,
  type QuestionFormValues,
} from '@/schemas/Admin/adminQuiz'
import type { AdminQuizQuestion } from '@/types/Admin/adminQuizzes'
import { QUESTION_TYPES } from '@/types/Admin/adminQuizzes'
import { quizOrderingErrorMessage } from '@/utils/Admin/adminQuizErrors'

const labels = {
  SELECT_MEANING: 'Select meaning',
  SELECT_WORD: 'Select word',
  SELECT_CORRECT_CONTEXT: 'Select correct context',
  FILL_BLANK: 'Fill in the blank',
} as const

interface Props {
  open: boolean
  quizId: string
  articleId: string
  question: AdminQuizQuestion | null
  nextDisplayOrder: number
  onClose: () => void
}

export function QuizQuestionDialog({
  open,
  quizId,
  articleId,
  question,
  nextDisplayOrder,
  onClose,
}: Props) {
  const [termSearch, setTermSearch] = useState('')
  const termsQuery = useAdminArticleTermListQuery(articleId, {
    page: 1,
    limit: 100,
    isActive: true,
    ...(termSearch ? { q: termSearch } : {}),
  })
  const createMutation = useCreateQuizQuestionMutation(quizId)
  const updateMutation = useUpdateQuizQuestionMutation(
    quizId,
    question?.id ?? '',
  )
  const mutation = question ? updateMutation : createMutation
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<QuestionFormValues, unknown, QuestionFormOutput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      articleVocabularyId: question?.articleVocabularyId ?? '',
      questionType: question?.questionType ?? 'SELECT_MEANING',
      prompt: question?.prompt ?? '',
      blankSentence: question?.blankSentence ?? '',
      correctAnswerText: question?.correctAnswerText ?? '',
      answerExplanation: question?.answerExplanation ?? '',
      isCaseSensitive: question?.isCaseSensitive ?? false,
      points: question?.points ?? 1,
      displayOrder: question?.displayOrder ?? nextDisplayOrder,
      isActive: question?.isActive ?? true,
    },
  })
  const questionType = useWatch({ control, name: 'questionType' })
  const hasOptions = Boolean(question?.options.length)

  const submit = handleSubmit((values) => {
    const request = toQuestionRequest(values)
    mutation.mutate(request, { onSuccess: onClose })
  })

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{question ? 'Edit question' : 'Add question'}</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" id="quiz-question-form" onSubmit={submit} spacing={2.25} noValidate>
          {mutation.isError ? (
            <Alert severity="error">
              {quizOrderingErrorMessage(mutation.error, 'question')}
            </Alert>
          ) : null}
          <Stack spacing={1.25}>
            <DebouncedSearchField
              initialValue=""
              label="Find contextual terms"
              placeholder="Search word, lemma, or meaning…"
              onCommit={setTermSearch}
            />
            <Controller
              control={control}
              name="articleVocabularyId"
              render={({ field }) => (
                <TextField
                  select
                  label="Contextual article term"
                  error={Boolean(errors.articleVocabularyId)}
                  helperText={
                    errors.articleVocabularyId?.message ??
                    'This is an active article_sentence_terms record from the quiz article.'
                  }
                  disabled={termsQuery.isPending}
                  {...field}
                >
                  <MenuItem value="">Choose a term</MenuItem>
                  {termsQuery.data?.items.map((term) => (
                    <MenuItem key={term.id} value={term.id}>
                      {term.wordDisplay} · sentence {term.sentenceOrder} · {term.contextualMeaningVi}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
          <Controller
            control={control}
            name="questionType"
            render={({ field }) => (
              <TextField
                select
                label="Question type"
                error={Boolean(errors.questionType)}
                helperText={
                  hasOptions
                    ? 'Delete all options before changing this question to fill in the blank.'
                    : errors.questionType?.message
                }
                {...field}
              >
                {QUESTION_TYPES.map((type) => (
                  <MenuItem
                    key={type}
                    value={type}
                    disabled={type === 'FILL_BLANK' && hasOptions}
                  >
                    {labels[type]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            label="Prompt"
            multiline
            minRows={2}
            error={Boolean(errors.prompt)}
            helperText={errors.prompt?.message}
            {...register('prompt')}
          />
          {questionType === 'FILL_BLANK' ? (
            <>
              <TextField
                label="Sentence with blank"
                placeholder="The lesson was ___."
                error={Boolean(errors.blankSentence)}
                helperText={errors.blankSentence?.message}
                {...register('blankSentence')}
              />
              <TextField
                label="Correct answer"
                error={Boolean(errors.correctAnswerText)}
                helperText={errors.correctAnswerText?.message}
                {...register('correctAnswerText')}
              />
              <Controller
                control={control}
                name="isCaseSensitive"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Answer is case-sensitive"
                  />
                )}
              />
            </>
          ) : (
            <Alert severity="info">
              Save the question first, then add choices and mark exactly one as correct.
            </Alert>
          )}
          <TextField
            label="Answer explanation"
            multiline
            minRows={2}
            error={Boolean(errors.answerExplanation)}
            helperText={errors.answerExplanation?.message ?? 'Optional feedback shown after grading.'}
            {...register('answerExplanation')}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Points"
              type="number"
              error={Boolean(errors.points)}
              helperText={errors.points?.message}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              {...register('points')}
            />
            <TextField
              label="Display order"
              type="number"
              error={Boolean(errors.displayOrder)}
              helperText={errors.displayOrder?.message ?? 'Must be unique within this quiz.'}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              {...register('displayOrder')}
            />
          </Stack>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Active and eligible for publication"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" form="quiz-question-form" variant="contained" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : question ? 'Save question' : 'Add question'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
