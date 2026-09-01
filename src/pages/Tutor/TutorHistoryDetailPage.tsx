import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ClockIcon, SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import { LoadingState } from '@/components/Shared/LoadingState'
import { useTutorSessionDetailQuery } from '@/hooks/Tutor/useTutor'
import type {
  MultipleChoicePayload,
  TutorSessionAnsweredItem,
} from '@/types/Tutor/tutor'
import { routePaths } from '@/utils/paths'

export function TutorHistoryDetailPage() {
  const { t } = useTranslation('tutor')
  const { sessionId = '' } = useParams<{ sessionId: string }>()

  const { data, isPending, isError, refetch } = useTutorSessionDetailQuery(
    sessionId,
    Boolean(sessionId),
  )

  if (isPending) {
    return <LoadingState paper={false} minHeight="50vh" size={40} />
  }

  if (isError || !data) {
    return (
      <Box sx={{ maxWidth: 760, mx: 'auto', py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Thử lại
            </Button>
          }
        >
          {t('errors.loadFailed')}
        </Alert>
      </Box>
    )
  }

  const { session, items, summary } = data

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'Trắc nghiệm'
      case 'CONTEXTUAL_CLOZE':
        return 'Điền từ trong câu'
      case 'TYPED_RECALL':
        return 'Gợi nhớ tự gõ'
      case 'MICRO_LESSON_RETEST':
        return 'Bài học ôn tập & Retest'
      default:
        return type
    }
  }

  const renderQuestionDetails = (item: TutorSessionAnsweredItem) => {
    const payload = item.questionPayload as Record<string, unknown>

    return (
      <Stack spacing={1.5}>
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {(payload?.questionPromptVi as string) || ''}
        </Typography>

        {payload?.sentenceWithBlank ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.default',
              fontFamily: '"Merriweather", serif',
            }}
          >
            <Typography variant="body1">
              {String(payload.sentenceWithBlank)}
            </Typography>
          </Paper>
        ) : null}

        {payload?.recallPromptVi ? (
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
          >
            <Typography variant="body2" color="text.secondary">
              {String(payload.recallPromptVi)}
            </Typography>
          </Paper>
        ) : null}

        {item.questionType === 'MULTIPLE_CHOICE' && Array.isArray((payload as unknown as MultipleChoicePayload)?.options) ? (
          <Stack spacing={1} sx={{ my: 1 }}>
            {(payload as unknown as MultipleChoicePayload).options.map((opt) => (
              <Box
                key={opt.id}
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor:
                    opt.id === item.correctAnswer
                      ? 'success.main'
                      : opt.id === item.userAnswer
                        ? 'error.main'
                        : 'divider',
                  bgcolor:
                    opt.id === item.correctAnswer
                      ? 'success.light'
                      : opt.id === item.userAnswer
                        ? 'error.light'
                        : 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    bgcolor: 'action.selected',
                  }}
                >
                  {opt.id}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {opt.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: { xs: 2, sm: 4 } }}>
      {/* Header & Back Button */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}
          >
            {t('detail.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('history.sessionDate', { date: session.studyDate })}
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to={routePaths.tutorHistory}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {t('detail.backToHistory')}
        </Button>
      </Stack>

      {/* Summary Header Card */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          mb: 4,
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip
                size="small"
                label={session.status}
                color={
                  session.status === 'COMPLETED'
                    ? 'success'
                    : session.status === 'ACTIVE'
                      ? 'warning'
                      : 'default'
                }
                sx={{ fontWeight: 700 }}
              />
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <ClockIcon size={14} color="currentColor" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {session.targetDurationMinutes} phút mục tiêu
                </Typography>
              </Stack>
            </Stack>

            {summary ? (
              <Typography variant="body2" color="text.secondary">
                Đúng {summary.correctCount}/{summary.completedActivities} câu (
                {Math.round(
                  (summary.correctCount / Math.max(1, summary.completedActivities)) *
                    100,
                )}
                %) — Thời gian thực tế: {Math.floor(summary.durationSeconds / 60)}m {summary.durationSeconds % 60}s
              </Typography>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SparklesIcon size={16} color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {items.length} câu hỏi đã thực hiện
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Items List */}
      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2.5 }}>
          <Typography color="text.secondary">{t('detail.noItems')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {items.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                borderLeftWidth: 4,
                borderLeftColor:
                  item.isCorrect === true
                    ? 'success.main'
                    : item.isCorrect === false
                      ? 'error.main'
                      : 'divider',
              }}
            >
              {/* Item Header */}
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {t('detail.itemHeading', { position: item.position })}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={getQuestionTypeLabel(item.questionType)}
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 22 }}
                  />

                  {item.isNewWord ? (
                    <Chip
                      size="small"
                      label="Từ mới"
                      color="secondary"
                      sx={{ fontWeight: 700, height: 22 }}
                    />
                  ) : null}

                  {item.hintUsed ? (
                    <Chip
                      size="small"
                      label={t('detail.hintUsedBadge')}
                      color="info"
                      variant="outlined"
                      sx={{ fontWeight: 600, height: 22 }}
                    />
                  ) : null}

                  {item.isCorrect !== null ? (
                    <Chip
                      size="small"
                      label={
                        item.isCorrect
                          ? t('detail.correctBadge')
                          : t('detail.incorrectBadge')
                      }
                      color={item.isCorrect ? 'success' : 'error'}
                      sx={{ fontWeight: 700, height: 22 }}
                    />
                  ) : null}
                </Stack>
              </Stack>

              {/* Question Content */}
              {renderQuestionDetails(item)}

              <Divider sx={{ my: 2 }} />

              {/* Answers & Explanation */}
              <Stack spacing={1.5}>
                {item.userAnswer !== null && item.userAnswer !== undefined ? (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                      {t('feedback.yourAnswer')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {String(item.userAnswer)}
                    </Typography>
                  </Box>
                ) : null}

                {item.correctAnswer !== null && item.correctAnswer !== undefined ? (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.dark', textTransform: 'uppercase' }}>
                      {t('feedback.correctAnswer')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                      {String(item.correctAnswer)}
                    </Typography>
                  </Box>
                ) : null}

                {item.explanationVi ? (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                      {t('feedback.explanation')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6, color: 'text.primary' }}>
                      {item.explanationVi}
                    </Typography>
                  </Box>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}
