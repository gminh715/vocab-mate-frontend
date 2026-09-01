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

  const targetWord = payload.wordDisplay?.trim() || ''

  // Render individual character slots with bottom dash underline
  const renderWordSlots = () => {
    const targetChars = targetWord ? targetWord.split('') : []
    const typedChars = answer.split('')

    if (targetChars.length === 0) {
      return (
        <Box
          component="span"
          sx={{
            px: 1.5,
            py: 0.25,
            mx: 0.5,
            borderRadius: 1.5,
            bgcolor: 'rgba(124, 58, 237, 0.08)',
            color: 'primary.dark',
            fontWeight: 700,
            borderBottom: '2.5px solid',
            borderColor: 'primary.main',
            display: 'inline-block',
          }}
        >
          {answer.trim() || '_______'}
        </Box>
      )
    }

    const slotCount = Math.max(targetChars.length, typedChars.length)
    const slots: React.ReactNode[] = []

    for (let i = 0; i < slotCount; i++) {
      const typedChar = typedChars[i]
      const targetChar = targetChars[i]

      if (targetChar === ' ' && !typedChar) {
        slots.push(
          <Box
            key={i}
            component="span"
            sx={{ width: '8px', display: 'inline-block' }}
          />,
        )
        continue
      }

      if (targetChar === '-' && !typedChar) {
        slots.push(
          <Box
            key={i}
            component="span"
            sx={{
              mx: '2px',
              color: 'primary.main',
              fontWeight: 800,
              fontSize: '1.2rem',
            }}
          >
            -
          </Box>,
        )
        continue
      }

      const isTyped = Boolean(typedChar)
      slots.push(
        <Box
          key={i}
          component="span"
          sx={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            minWidth: { xs: '14px', sm: '18px' },
            mx: '2.5px',
            borderBottom: '2.5px solid',
            borderColor: isTyped ? 'primary.main' : 'rgba(124, 58, 237, 0.4)',
            pb: '1px',
          }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: 800,
              fontSize: '1.2rem',
              lineHeight: 1.2,
              color: isTyped ? 'primary.dark' : 'transparent',
              fontFamily: '"Merriweather", serif',
              userSelect: 'none',
            }}
          >
            {typedChar || (targetChar && targetChar !== ' ' ? targetChar : 'x')}
          </Box>
        </Box>,
      )
    }

    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'baseline',
          px: 1,
          py: 0.25,
          mx: 0.5,
          borderRadius: 2,
          bgcolor: 'rgba(124, 58, 237, 0.08)',
          verticalAlign: 'baseline',
        }}
      >
        {slots}
      </Box>
    )
  }

  // Highlight blank part if present in sentenceWithBlank
  const renderSentence = () => {
    const parts = payload.sentenceWithBlank.split(/(___+|\[\.\.\.\])/)
    return (
      <Typography
        variant="h6"
        component="p"
        sx={{
          lineHeight: 1.8,
          fontWeight: 500,
          color: 'text.primary',
          fontFamily: '"Merriweather", serif',
        }}
      >
        {parts.map((part, index) => {
          if (part.startsWith('_') || part === '[...]') {
            return <span key={index}>{renderWordSlots()}</span>
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
