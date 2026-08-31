import Box from '@mui/material/Box'
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
  return (
    <Box sx={{ width: '100%' }}>
      {payload.retestType === 'CONTEXTUAL_CLOZE' && payload.sentenceWithBlank ? (
        <ContextualClozeQuestion
          payload={{
            questionPromptVi: payload.questionPromptVi,
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
            questionPromptVi: payload.questionPromptVi,
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
