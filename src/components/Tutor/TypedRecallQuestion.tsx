import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TypedRecallPayload } from '@/types/Tutor/tutor'

interface TypedRecallQuestionProps {
  payload: TypedRecallPayload
  onSubmit: (answer: string) => void
  disabled?: boolean
  isSubmitting?: boolean
}

export function TypedRecallQuestion({
  payload,
  onSubmit,
  disabled = false,
  isSubmitting = false,
}: TypedRecallQuestionProps) {
  const { t } = useTranslation('tutor')
  const [answer, setAnswer] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed || disabled || isSubmitting) return
    onSubmit(trimmed)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}
      >
        {payload.questionPromptVi}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2.5,
          bgcolor: 'background.paper',
          borderColor: 'primary.main',
          borderWidth: 1.5,
        }}
      >
        <Typography
          variant="h6"
          component="p"
          sx={{
            lineHeight: 1.5,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {payload.recallPromptVi}
        </Typography>
      </Paper>

      <TextField
        fullWidth
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled || isSubmitting}
        placeholder={t('session.enterAnswerPlaceholder')}
        variant="outlined"
        autoComplete="off"
        slotProps={{
          htmlInput: {
            'aria-label': 'Nhập câu trả lời gợi nhớ',
            style: { fontSize: '1.125rem', fontWeight: 600 },
          },
        }}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={!answer.trim() || disabled || isSubmitting}
        sx={{
          py: 1.5,
          borderRadius: 2,
          fontWeight: 700,
          fontSize: '1rem',
          boxShadow: 2,
        }}
      >
        {isSubmitting ? t('session.submitting') : t('session.submitBtn')}
      </Button>
    </Box>
  )
}
