import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MultipleChoicePayload, OptionId } from '@/types/Tutor/tutor'

interface MultipleChoiceQuestionProps {
  payload: MultipleChoicePayload
  onSubmit: (answer: string) => void
  disabled?: boolean
  isSubmitting?: boolean
}

export function MultipleChoiceQuestion({
  payload,
  onSubmit,
  disabled = false,
  isSubmitting = false,
}: MultipleChoiceQuestionProps) {
  const { t } = useTranslation('tutor')
  const [selectedOption, setSelectedOption] = useState<OptionId | null>(null)

  const handleSelect = (id: OptionId) => {
    if (disabled || isSubmitting) return
    setSelectedOption(id)
  }

  const handleSubmit = () => {
    if (!selectedOption || disabled || isSubmitting) return
    onSubmit(selectedOption)
  }

  // Keyboard shortcut listener for options (1-4 or A-D)
  useEffect(() => {
    if (disabled || isSubmitting) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const key = e.key.toUpperCase()
      const keyIndexMap: Record<string, OptionId> = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
        A: 'A',
        B: 'B',
        C: 'C',
        D: 'D',
      }

      if (key in keyIndexMap) {
        const optionId = keyIndexMap[key]
        if (payload.options.some((opt) => opt.id === optionId)) {
          e.preventDefault()
          setSelectedOption(optionId)
        }
      } else if (e.key === 'Enter' && selectedOption) {
        e.preventDefault()
        onSubmit(selectedOption)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, isSubmitting, payload.options, selectedOption, onSubmit])

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="h6"
        component="h2"
        sx={{ fontWeight: 700, mb: 3, lineHeight: 1.4, color: 'text.primary' }}
      >
        {payload.questionPromptVi}
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 3 }} role="radiogroup" aria-label="Multiple choice options">
        {payload.options.map((option) => {
          const isSelected = selectedOption === option.id

          return (
            <Paper
              key={option.id}
              variant="outlined"
              component={ButtonBase}
              onClick={() => handleSelect(option.id)}
              disabled={disabled || isSubmitting}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Lựa chọn ${option.id}: ${option.text}`}
              sx={{
                width: '100%',
                p: 2,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textAlign: 'left',
                cursor: disabled || isSubmitting ? 'default' : 'pointer',
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderWidth: isSelected ? 2 : 1,
                bgcolor: isSelected ? 'primary.light' : 'background.paper',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: isSelected ? 'primary.light' : 'action.hover',
                },
                '&:focus-visible': {
                  outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    bgcolor: isSelected ? 'primary.main' : 'action.selected',
                    color: isSelected ? 'primary.contrastText' : 'text.secondary',
                    flexShrink: 0,
                  }}
                >
                  {option.id}
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'primary.dark' : 'text.primary',
                    fontSize: '1rem',
                  }}
                >
                  {option.text}
                </Typography>
              </Stack>
            </Paper>
          )
        })}
      </Stack>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSubmit}
        disabled={!selectedOption || disabled || isSubmitting}
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
