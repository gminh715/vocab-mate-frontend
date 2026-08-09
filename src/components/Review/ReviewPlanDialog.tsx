import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  REVIEW_GOALS,
  REVIEW_TARGET_DURATIONS,
  type DailyReviewEstimate,
  type ReviewGoal,
  type ReviewTargetDuration,
} from '@/types/Review/review'

const resolveItemEstimate = (
  estimates: DailyReviewEstimate[],
  duration: ReviewTargetDuration,
  goal: ReviewGoal,
  dueCount: number,
): number => {
  const durationEstimate = estimates.find(
    ({ targetDurationMinutes }) => targetDurationMinutes === duration,
  )

  return (
    durationEstimate?.goalEstimates?.find(
      ({ reviewGoal }) => reviewGoal === goal,
    )?.estimatedItemCount ??
    durationEstimate?.estimatedItemCount ??
    Math.min(dueCount, 1)
  )
}

interface ReviewPlanDialogProps {
  open: boolean
  dueCount: number
  estimates: DailyReviewEstimate[]
  onClose: () => void
  onStart: (selection: {
    targetDurationMinutes: ReviewTargetDuration
    reviewGoal: ReviewGoal
  }) => void
}

export function ReviewPlanDialog({
  open,
  dueCount,
  estimates,
  onClose,
  onStart,
}: ReviewPlanDialogProps) {
  const { t } = useTranslation('home')
  const [duration, setDuration] =
    useState<ReviewTargetDuration>(10)
  const [goal, setGoal] = useState<ReviewGoal>('BALANCED')
  const selectedEstimate = resolveItemEstimate(
    estimates,
    duration,
    goal,
    dueCount,
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            m: { xs: 0, sm: 4 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
          },
        },
      }}
    >
      <Box sx={{ px: 3, pt: 3 }}>
        <Typography
          component="span"
          sx={{
            display: 'block',
            color: 'primary.main',
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
          }}
        >
          {t('review.planDialog.eyebrow')}
        </Typography>
      </Box>
      <DialogTitle
        sx={{
          pt: 0.75,
          pb: 1,
          fontFamily: '"Merriweather", serif',
          fontSize: { xs: 28, sm: 34 },
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
        }}
      >
        {t('review.planDialog.title')}
      </DialogTitle>

      <DialogContent sx={{ pt: '12px !important' }}>
        <Typography color="text.secondary">
          {t('review.planDialog.description', { count: dueCount })}
        </Typography>

        <Typography sx={{ mt: 3, mb: 1.25, fontWeight: 800 }}>
          {t('review.planDialog.durationLabel')}
        </Typography>
        <Box
          role="radiogroup"
          aria-label={t('review.planDialog.durationLabel')}
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}
        >
          {REVIEW_TARGET_DURATIONS.map((option) => {
            const selected = duration === option
            const estimatedItemCount = resolveItemEstimate(
              estimates,
              option,
              goal,
              dueCount,
            )
            return (
              <ButtonBase
                key={option}
                role="radio"
                aria-checked={selected}
                onClick={() => setDuration(option)}
                sx={{
                  minHeight: 92,
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: selected ? 'primary.light' : 'background.paper',
                  color: selected ? 'primary.dark' : 'text.primary',
                  px: 1,
                  py: 1.5,
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography
                    sx={{
                      fontFamily: '"Merriweather", serif',
                      fontSize: { xs: 23, sm: 27 },
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {option}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 750 }}>
                    {t('review.planDialog.minutes')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('review.planDialog.itemEstimate', {
                      count: estimatedItemCount,
                    })}
                  </Typography>
                </Stack>
              </ButtonBase>
            )
          })}
        </Box>

        <Typography sx={{ mt: 3, mb: 1.25, fontWeight: 800 }}>
          {t('review.planDialog.goalLabel')}
        </Typography>
        <Box
          role="radiogroup"
          aria-label={t('review.planDialog.goalLabel')}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1,
          }}
        >
          {REVIEW_GOALS.map((option) => {
            const selected = goal === option
            return (
              <ButtonBase
                key={option}
                role="radio"
                aria-checked={selected}
                onClick={() => setGoal(option)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  border: '1px solid',
                  borderColor: selected ? 'secondary.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: selected ? 'secondary.light' : 'background.paper',
                  px: 2,
                  py: 1.5,
                  '&:hover': { borderColor: 'secondary.main' },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>
                    {t(`review.planDialog.goals.${option}.label`)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`review.planDialog.goals.${option}.description`)}
                  </Typography>
                </Box>
              </ButtonBase>
            )
          })}
        </Box>

        <Box
          aria-live="polite"
          sx={{
            mt: 3,
            p: 2,
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            borderRadius: '4px 12px 12px 4px',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('review.planDialog.selectedPlan')}
          </Typography>
          <Typography sx={{ mt: 0.25, fontWeight: 800 }}>
            {t('review.planDialog.planSummary', {
              minutes: duration,
              count: selectedEstimate,
              goal: t(`review.planDialog.goals.${goal}.label`),
            })}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('review.planDialog.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            onStart({
              targetDurationMinutes: duration,
              reviewGoal: goal,
            })
          }
        >
          {t('review.planDialog.start')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
