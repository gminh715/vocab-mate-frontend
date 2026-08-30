import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContextualClozePayload } from '@/types/Tutor/tutor'

interface ContextualClozeQuestionProps {
  payload: ContextualClozePayload
  onSubmit: (answer: string) => void
  disabled?: boolean
  isSubmitting?: boolean
}

export function ContextualClozeQuestion({
  payload,
  onSubmit,
  disabled = false,
  isSubmitting = false,
}: ContextualClozeQuestionProps) {
  const { t } = useTranslation('tutor')
  const [answer, setAnswer] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed || disabled || isSubmitting) return
    onSubmit(trimmed)
  }

  // Highlight blank part if present in sentenceWithBlank
  const renderSentence = () => {
    const parts = payload.sentenceWithBlank.split(/(___+|\[\.\.\.\])/)
    return (
      <Typography
        variant="h6"
        component="p"
        sx={{
          lineHeight: 1.6,
          fontWeight: 500,
          color: 'text.primary',
          fontFamily: '"Merriweather", serif',
        }}
      >
        {parts.map((part, index) => {
          if (part.startsWith('_') || part === '[...]') {
            return (
              <Box
                component="span"
                key={index}
                sx={{
                  px: 1.5,
                  py: 0.25,
                  mx: 0.5,
                  borderRadius: 1,
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  fontWeight: 700,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  display: 'inline-block',
                }}
              >
                {answer.trim() || '_______'}
              </Box>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </Typography>
    )
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
          borderColor: 'divider',
        }}
      >
        {renderSentence()}
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
            'aria-label': 'Nhập từ còn thiếu',
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
