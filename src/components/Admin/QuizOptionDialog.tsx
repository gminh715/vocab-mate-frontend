import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { Controller, useForm } from 'react-hook-form'
import {
  useCreateQuestionOptionMutation,
  useUpdateQuestionOptionMutation,
} from '@/hooks/Admin/useAdminQuizzes'
import {
  optionFormSchema,
  toOptionRequest,
  type OptionFormOutput,
  type OptionFormValues,
} from '@/schemas/Admin/adminQuiz'
import type { AdminQuestionOption } from '@/types/Admin/adminQuizzes'
import { quizOrderingErrorMessage } from '@/utils/Admin/adminQuizErrors'

interface Props {
  open: boolean
  quizId: string
  questionId: string
  option: AdminQuestionOption | null
  nextDisplayOrder: number
  onClose: () => void
}

export function QuizOptionDialog({
  open,
  quizId,
  questionId,
  option,
  nextDisplayOrder,
  onClose,
}: Props) {
  const createMutation = useCreateQuestionOptionMutation(quizId, questionId)
  const updateMutation = useUpdateQuestionOptionMutation(
    quizId,
    questionId,
    option?.id ?? '',
  )
  const mutation = option ? updateMutation : createMutation
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<OptionFormValues, unknown, OptionFormOutput>({
    resolver: zodResolver(optionFormSchema),
    defaultValues: {
      optionText: option?.optionText ?? '',
      isCorrect: option?.isCorrect ?? false,
      explanation: option?.explanation ?? '',
      displayOrder: option?.displayOrder ?? nextDisplayOrder,
    },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate(toOptionRequest(values), { onSuccess: onClose })
  })
  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{option ? 'Edit answer option' : 'Add answer option'}</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" id="quiz-option-form" onSubmit={submit} spacing={2.25} noValidate>
          {mutation.isError ? (
            <Alert severity="error">
              {quizOrderingErrorMessage(mutation.error, 'option')}
            </Alert>
          ) : null}
          <TextField
            label="Option text"
            multiline
            minRows={2}
            error={Boolean(errors.optionText)}
            helperText={errors.optionText?.message}
            {...register('optionText')}
          />
          <TextField
            label="Explanation"
            multiline
            minRows={2}
            error={Boolean(errors.explanation)}
            helperText={errors.explanation?.message ?? 'Optional feedback for this choice.'}
            {...register('explanation')}
          />
          <TextField
            label="Display order"
            type="number"
            error={Boolean(errors.displayOrder)}
            helperText={errors.displayOrder?.message ?? 'Must be unique within this question.'}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            {...register('displayOrder')}
          />
          <Controller
            control={control}
            name="isCorrect"
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="This is the correct answer"
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" form="quiz-option-form" variant="contained" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : option ? 'Save option' : 'Add option'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
