import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  sentenceFormSchema,
  toUpdateArticleSentenceRequest,
  type SentenceFormOutput,
  type SentenceFormValues,
} from '@/schemas/Admin/adminArticleContent'
import type {
  ArticleSentence,
  UpdateArticleSentenceRequest,
} from '@/types/Admin/adminArticleContent'

interface ArticleSentenceEditorProps {
  sentence: ArticleSentence
  isPending: boolean
  isReadOnly: boolean
  serverError: string | null
  onSubmit: (request: UpdateArticleSentenceRequest) => Promise<void>
}

const sentenceValues = (sentence: ArticleSentence): SentenceFormValues => ({
  translationVi: sentence.translationVi ?? '',
  explanationVi: sentence.explanationVi ?? '',
  referenceExplanation: sentence.referenceExplanation ?? '',
  skill: sentence.skill ?? '',
  isActive: sentence.isActive,
})

export function ArticleSentenceEditor({
  sentence,
  isPending,
  isReadOnly,
  serverError,
  onSubmit,
}: ArticleSentenceEditorProps) {
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<SentenceFormValues, unknown, SentenceFormOutput>({
    resolver: zodResolver(sentenceFormSchema),
    defaultValues: sentenceValues(sentence),
  })

  useEffect(() => {
    reset(sentenceValues(sentence))
  }, [reset, sentence])

  useEffect(() => {
    if (!isDirty || isPending) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty, isPending])

  const submit = handleSubmit(async (values) => {
    const optionalFields = [
      ['translationVi', 'translation'],
      ['explanationVi', 'explanation'],
      ['referenceExplanation', 'reference explanation'],
      ['skill', 'skill'],
    ] as const
    const initialValues = sentenceValues(sentence)
    const clearedField = optionalFields.find(
      ([name]) => initialValues[name] && !values[name],
    )
    if (clearedField) {
      setError(clearedField[0], {
        message: `The current API cannot clear this ${clearedField[1]}. Enter a replacement value.`,
      })
      return
    }

    await onSubmit(toUpdateArticleSentenceRequest(values))
  })

  return (
    <Stack spacing={2.5}>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderLeft: 4,
          borderLeftColor: 'primary.main',
          bgcolor: 'primary.light',
        }}
      >
        <Typography
          sx={{
            color: 'primary.dark',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Source sentence · read only
        </Typography>
        <Typography
          component="blockquote"
          sx={{
            m: 0,
            mt: 1.25,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 19,
            lineHeight: 1.55,
          }}
        >
          {sentence.sentenceText}
        </Typography>
      </Paper>

      <Box
        component="form"
        onSubmit={submit}
        autoComplete="off"
        noValidate
      >
        <Stack spacing={2}>
          {serverError ? <Alert severity="error">{serverError}</Alert> : null}
          <TextField
            label="Vietnamese translation"
            multiline
            minRows={3}
            disabled={isReadOnly}
            error={Boolean(errors.translationVi)}
            helperText={errors.translationVi?.message}
            {...register('translationVi')}
          />
          <TextField
            label="Vietnamese explanation"
            multiline
            minRows={4}
            disabled={isReadOnly}
            error={Boolean(errors.explanationVi)}
            helperText={errors.explanationVi?.message}
            {...register('explanationVi')}
          />
          <TextField
            label="Reference explanation"
            multiline
            minRows={3}
            disabled={isReadOnly}
            error={Boolean(errors.referenceExplanation)}
            helperText={errors.referenceExplanation?.message}
            {...register('referenceExplanation')}
          />
          <TextField
            label="Skill"
            disabled={isReadOnly}
            error={Boolean(errors.skill)}
            helperText={errors.skill?.message}
            {...register('skill')}
          />
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(_, checked) => field.onChange(checked)}
                    disabled={isReadOnly}
                  />
                }
                label="Active sentence"
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isReadOnly || isPending || !isDirty}
            sx={{ alignSelf: 'flex-start' }}
          >
            {isPending ? 'Saving…' : 'Save sentence'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}
