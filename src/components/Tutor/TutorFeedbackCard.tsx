import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

interface TutorFeedbackCardProps {
  isCorrect: boolean | null
  userAnswer?: unknown
  correctAnswer?: unknown
  explanationVi?: string | null
  feedbackVi?: string | null
  fsrsRating?: number | null
  onNext: () => void
  isLastItem?: boolean
  isLoadingNext?: boolean
}

export function TutorFeedbackCard({
  isCorrect,
  userAnswer,
  correctAnswer,
  explanationVi,
  feedbackVi,
  fsrsRating,
  onNext,
  isLastItem = false,
  isLoadingNext = false,
}: TutorFeedbackCardProps) {
  const { t } = useTranslation('tutor')

  const getRatingLabel = (rating: number | null | undefined) => {
    switch (rating) {
      case 1:
        return t('feedback.ratingAgain')
      case 2:
        return t('feedback.ratingHard')
      case 3:
        return t('feedback.ratingGood')
      case 4:
        return t('feedback.ratingEasy')
      default:
        return null
    }
  }

  const ratingLabel = getRatingLabel(fsrsRating)

  return (
    <Paper
      variant="outlined"
      sx={{
        width: '100%',
        mt: 3,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        borderColor: isCorrect ? 'success.main' : 'error.main',
        borderWidth: 2,
        bgcolor: isCorrect ? 'success.light' : 'error.light',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: isCorrect ? 'success.dark' : 'error.dark',
              fontSize: '1.25rem',
            }}
          >
            {isCorrect ? t('feedback.correct') : t('feedback.incorrect')}
          </Typography>

          {ratingLabel ? (
            <Chip
              size="small"
              label={ratingLabel}
              color={isCorrect ? 'success' : 'error'}
              sx={{ fontWeight: 700 }}
            />
          ) : null}
        </Stack>

        {feedbackVi ? (
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: isCorrect ? 'success.dark' : 'error.dark',
            }}
          >
            {feedbackVi}
          </Typography>
        ) : null}

        <Divider sx={{ my: 1, borderColor: isCorrect ? 'success.main' : 'error.main', opacity: 0.3 }} />

        <Stack spacing={1.5}>
          {userAnswer !== undefined && userAnswer !== null ? (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                {t('feedback.yourAnswer')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {String(userAnswer)}
              </Typography>
            </Box>
          ) : null}

          {!isCorrect && correctAnswer !== undefined && correctAnswer !== null ? (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.dark', textTransform: 'uppercase' }}>
                {t('feedback.correctAnswer')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.dark', fontSize: '1.125rem' }}>
                {String(correctAnswer)}
              </Typography>
            </Box>
          ) : null}

          {explanationVi ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                {t('feedback.explanation')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6, color: 'text.primary' }}>
                {explanationVi}
              </Typography>
            </Box>
          ) : null}
        </Stack>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={onNext}
          disabled={isLoadingNext}
          color={isCorrect ? 'success' : 'primary'}
          startIcon={
            isLoadingNext ? (
              <CircularProgress size={18} color="inherit" />
            ) : null
          }
          sx={{
            mt: 2,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: 3,
          }}
        >
          {isLoadingNext
            ? t('session.loadingNextQuestion', 'Đang chuẩn bị câu tiếp theo...')
            : isLastItem
              ? t('session.finishSession')
              : t('session.nextQuestion')}
        </Button>
      </Stack>
    </Paper>
  )
}
