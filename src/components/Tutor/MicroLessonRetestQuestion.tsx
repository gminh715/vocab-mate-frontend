import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import type { MicroLessonRetestPayload } from '@/types/Tutor/tutor'
import { ContextualClozeQuestion } from './ContextualClozeQuestion'
import { TypedRecallQuestion } from './TypedRecallQuestion'

interface MicroLessonRetestQuestionProps {
  payload: MicroLessonRetestPayload
  onSubmit: (answer: string) => void
  disabled?: boolean
  isSubmitting?: boolean
}

export function MicroLessonRetestQuestion({
  payload,
  onSubmit,
  disabled = false,
  isSubmitting = false,
}: MicroLessonRetestQuestionProps) {
  const { t } = useTranslation('tutor')
  const [isRetestReady, setIsRetestReady] = useState(false)

  if (!isRetestReady) {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <SparklesIcon size={20} color="#7c3aed" />
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontWeight: 800, color: 'text.primary' }}
          >
            {t('session.microLessonTitle')}
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('session.microLessonPrompt')}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            borderColor: 'primary.main',
            borderWidth: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.7,
              fontSize: '1.0625rem',
              color: 'text.primary',
              whiteSpace: 'pre-line',
            }}
          >
            {payload.microLessonVi}
          </Typography>
        </Paper>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => setIsRetestReady(true)}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: 2,
          }}
        >
          {t('session.microLessonStartBtn')}
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Small collapsible reference to micro-lesson */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'action.hover',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5 }}>
          {t('session.microLessonTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {payload.microLessonVi}
        </Typography>
      </Paper>

      {payload.retestType === 'CONTEXTUAL_CLOZE' && payload.sentenceWithBlank ? (
        <ContextualClozeQuestion
          payload={{
            questionPromptVi: `${t('session.retestPrompt')} ${payload.questionPromptVi}`,
            sentenceWithBlank: payload.sentenceWithBlank,
            wordDisplay: payload.wordDisplay,
            meaningVi: payload.meaningVi,
          }}
          onSubmit={onSubmit}
          disabled={disabled}
          isSubmitting={isSubmitting}
        />
      ) : (
        <TypedRecallQuestion
          payload={{
            questionPromptVi: `${t('session.retestPrompt')} ${payload.questionPromptVi}`,
            recallPromptVi: payload.recallPromptVi || payload.questionPromptVi,
            wordDisplay: payload.wordDisplay,
            meaningVi: payload.meaningVi,
          }}
          onSubmit={onSubmit}
          disabled={disabled}
          isSubmitting={isSubmitting}
        />
      )}
    </Box>
  )
}
