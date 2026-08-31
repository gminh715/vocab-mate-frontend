import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
  onNext,
  isLastItem = false,
  isLoadingNext = false,
}: TutorFeedbackCardProps) {
  const { t } = useTranslation('tutor')

  return (
    <Paper
      variant="outlined"
      sx={{
        width: '100%',
        mt: 3,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        borderColor: isCorrect ? '#86EFAC' : '#FECACA',
        borderWidth: 2,
        bgcolor: isCorrect ? '#F0FDF4' : '#FEF2F2',
        boxShadow: isCorrect
          ? '0 8px 30px rgba(22, 163, 74, 0.08)'
          : '0 8px 30px rgba(220, 38, 38, 0.08)',
      }}
    >
      <Stack spacing={2}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: isCorrect ? '#15803D' : '#DC2626',
            fontSize: '1.25rem',
          }}
        >
          {isCorrect ? t('feedback.correct') : t('feedback.incorrect')}
        </Typography>

        {feedbackVi ? (
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: isCorrect ? '#166534' : '#991B1B',
            }}
          >
            {feedbackVi}
          </Typography>
        ) : null}

        <Divider
          sx={{
            my: 1,
            borderColor: isCorrect ? '#BBF7D0' : '#FECACA',
          }}
        />

        <Stack spacing={1.5}>
          {userAnswer !== undefined && userAnswer !== null ? (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: isCorrect ? '#166534' : '#991B1B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {t('feedback.yourAnswer')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: isCorrect ? '#14532D' : '#7F1D1D',
                  textDecoration: !isCorrect ? 'line-through' : 'none',
                }}
              >
                {String(userAnswer)}
              </Typography>
            </Box>
          ) : null}

          {!isCorrect && correctAnswer !== undefined && correctAnswer !== null ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                border: '1px solid #BBF7D0',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#15803D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'block',
                }}
              >
                {t('feedback.correctAnswer')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 800,
                  color: '#15803D',
                  fontSize: '1.125rem',
                  mt: 0.25,
                }}
              >
                {String(correctAnswer)}
              </Typography>
            </Box>
          ) : null}

          {explanationVi ? (
            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                border: `1px solid ${isCorrect ? '#DCFCE7' : '#FEE2E2'}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: isCorrect ? '#15803D' : '#991B1B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                {t('feedback.explanation')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.65,
                  color: '#1F2937',
                  fontWeight: 500,
                }}
              >
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
            bgcolor: isCorrect ? '#16A34A' : '#176B4B',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            '&:hover': {
              bgcolor: isCorrect ? '#15803D' : '#0F5138',
            },
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
