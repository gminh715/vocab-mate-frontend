import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type {
  ReviewAgentFeedback,
  ReviewErrorType,
  ReviewSkillDimension,
} from '@/types/Review/review'

const skillKey = (skill: ReviewSkillDimension) =>
  `feedback.skills.${skill}` as const

const errorKey = (error: ReviewErrorType) =>
  `feedback.errors.${error}` as const

interface AgentFeedbackCardProps {
  feedback: ReviewAgentFeedback
}

export function AgentFeedbackCard({ feedback }: AgentFeedbackCardProps) {
  const { t } = useTranslation('review')

  return (
    <Paper
      component="aside"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-labelledby="review-feedback-heading"
      variant="outlined"
      sx={{
        mt: 3,
        p: { xs: 2, sm: 2.5 },
        borderLeft: 5,
        borderLeftColor: 'secondary.main',
        bgcolor: 'secondary.light',
        overflow: 'hidden',
      }}
    >
      <Typography
        sx={{
          color: 'secondary.dark',
          fontSize: 12,
          fontWeight: 850,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {t('feedback.eyebrow')}
      </Typography>
      <Typography
        id="review-feedback-heading"
        component="h3"
        variant="h6"
        sx={{ mt: 0.5, fontWeight: 850, textWrap: 'balance' }}
      >
        {t('feedback.title')}
      </Typography>

      <Stack
        direction="row"
        useFlexGap
        sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1, minWidth: 0 }}
      >
        <Chip
          label={t('feedback.focus', {
            skill: t(skillKey(feedback.skillDimension)),
          })}
          color="primary"
          variant="outlined"
          sx={{ height: 'auto', maxWidth: '100%', '& .MuiChip-label': { py: 0.75, whiteSpace: 'normal' } }}
        />
        <Chip
          label={t('feedback.pattern', {
            error: t(errorKey(feedback.errorType)),
          })}
          variant="outlined"
          sx={{ height: 'auto', maxWidth: '100%', '& .MuiChip-label': { py: 0.75, whiteSpace: 'normal' } }}
        />
      </Stack>

      {feedback.microLesson ? (
        <Box sx={{ mt: 2, minWidth: 0 }}>
          <Typography component="h4" sx={{ fontWeight: 850, overflowWrap: 'anywhere' }}>
            {feedback.microLesson.title}
          </Typography>
          <Typography sx={{ mt: 0.75, lineHeight: 1.7, overflowWrap: 'anywhere' }}>
            {feedback.microLesson.explanation}
          </Typography>
          <Box
            component="blockquote"
            sx={{ m: 0, mt: 1.5, pl: 1.5, borderLeft: 3, borderColor: 'secondary.main' }}
          >
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 800 }}>
              {t('feedback.example')}
            </Typography>
            <Typography sx={{ mt: 0.25, fontStyle: 'italic', overflowWrap: 'anywhere' }}>
              {feedback.microLesson.example}
            </Typography>
          </Box>
        </Box>
      ) : null}

      {feedback.retestAfterItems ? (
        <Typography sx={{ mt: 2, fontWeight: 800, overflowWrap: 'anywhere' }}>
          {t('feedback.retest', { count: feedback.retestAfterItems })}
        </Typography>
      ) : null}
    </Paper>
  )
}
