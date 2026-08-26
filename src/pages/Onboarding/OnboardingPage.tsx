import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePlacementVocabularyQuery } from '@/hooks/Placement/usePlacement'
import { useUpdateMyProfileMutation } from '@/hooks/User/useProfile'
import {
  CEFR_LEVELS,
  DAILY_STUDY_MINUTES,
  type CefrLevel,
  type DailyStudyMinutes,
} from '@/types/Auth/auth'
import type {
  PlacementQuestion,
  PlacementScores,
  PlacementVocabularyEntry,
} from '@/types/Placement/placement'
import {
  createPlacementQuestions,
  placementLevelFromScores,
  scorePlacementTest,
} from '@/utils/Placement/placementTest'
import { routePaths } from '@/utils/paths'

type OnboardingPhase = 'INTRO' | 'TEST' | 'PLAN'

const cefrRank = (level: CefrLevel) => CEFR_LEVELS.indexOf(level)

function ScoreChip({
  label,
  score,
}: {
  label: string
  score: PlacementScores[keyof PlacementScores]
}) {
  const { t } = useTranslation('onboarding')
  return (
    <Chip
      variant="outlined"
      label={`${label}: ${t('score', { correct: score.correct, total: score.total })}`}
      sx={{ fontWeight: 750 }}
    />
  )
}

function PlacementExperience({
  entries,
}: {
  entries: PlacementVocabularyEntry[]
}) {
  const { t } = useTranslation('onboarding')
  const navigate = useNavigate()
  const updateProfile = useUpdateMyProfileMutation()
  const [questions] = useState<PlacementQuestion[]>(() =>
    createPlacementQuestions(entries),
  )
  const [phase, setPhase] = useState<OnboardingPhase>('INTRO')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [scores, setScores] = useState<PlacementScores | null>(null)
  const [resultLevel, setResultLevel] = useState<CefrLevel>('A1')
  const [learningGoal, setLearningGoal] = useState<CefrLevel>('A2')
  const [dailyStudyMinutes, setDailyStudyMinutes] =
    useState<DailyStudyMinutes>(10)

  const question = questions[questionIndex]
  const isLastQuestion = questionIndex === questions.length - 1

  const completeQuestion = () => {
    if (!selectedOptionId) return
    const nextAnswers = { ...answers, [question.id]: selectedOptionId }
    setAnswers(nextAnswers)
    setSelectedOptionId(null)

    if (!isLastQuestion) {
      setQuestionIndex((current) => current + 1)
      return
    }

    const nextScores = scorePlacementTest(questions, nextAnswers)
    const nextLevel = placementLevelFromScores(nextScores)
    const nextGoal = CEFR_LEVELS[Math.min(cefrRank(nextLevel) + 1, CEFR_LEVELS.length - 1)]
    setScores(nextScores)
    setResultLevel(nextLevel)
    setLearningGoal(nextGoal)
    setPhase('PLAN')
  }

  const savePlan = async () => {
    try {
      await updateProfile.mutateAsync({
        currentCefrLevel: resultLevel,
        learningGoal,
        dailyStudyMinutes,
      })
      navigate(routePaths.home, { replace: true })
    } catch {
      // The mutation error is rendered below the plan controls.
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        width: '100%',
        maxWidth: 760,
        p: { xs: 2.5, sm: 4.5 },
        borderRadius: { xs: 3, sm: 4 },
        borderColor: 'primary.main',
        boxShadow: '0 24px 70px rgba(15, 76, 92, 0.12)',
      }}
    >
      {phase === 'INTRO' ? (
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 38, sm: 52 } }}>
              {t('title')}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 620, fontSize: 17 }}>
              {t('intro')}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: 'primary.light',
              borderLeft: '5px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>{t('distribution')}</Typography>
          </Box>
          <Button variant="contained" size="large" onClick={() => setPhase('TEST')}>
            {t('start')}
          </Button>
        </Stack>
      ) : null}

      {phase === 'TEST' ? (
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800 }}>
                {t('question', { current: questionIndex + 1, total: questions.length })}
              </Typography>
              <Chip size="small" color="primary" label={question.level} sx={{ fontWeight: 800 }} />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={((questionIndex + 1) / questions.length) * 100}
              sx={{ mt: 1.5, height: 7, borderRadius: 99 }}
            />
          </Box>
          <Box>
            <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 30, sm: 38 } }}>
              {t('prompt', { word: question.word })}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {t('wordClass', { wordClass: question.wordClass })}
            </Typography>
          </Box>
          <Box role="radiogroup" aria-label={t('prompt', { word: question.word })} sx={{ display: 'grid', gap: 1.25 }}>
            {question.options.map((option) => {
              const selected = selectedOptionId === option.id
              return (
                <ButtonBase
                  key={option.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedOptionId(option.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    minHeight: 58,
                    px: 2.25,
                    py: 1.5,
                    textAlign: 'left',
                    border: '1px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: selected ? 'primary.light' : 'background.paper',
                    fontWeight: selected ? 800 : 600,
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  {option.meaningVi}
                </ButtonBase>
              )
            })}
          </Box>
          <Button variant="contained" size="large" disabled={!selectedOptionId} onClick={completeQuestion}>
            {t(isLastQuestion ? 'finish' : 'continue')}
          </Button>
        </Stack>
      ) : null}

      {phase === 'PLAN' && scores ? (
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 34, sm: 48 } }}>
              {t('resultTitle', { level: resultLevel })}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>{t('resultBody')}</Typography>
          </Box>
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
            <ScoreChip label={t('basic')} score={scores.BASIC} />
            <ScoreChip label={t('intermediate')} score={scores.INTERMEDIATE} />
            <ScoreChip label={t('advanced')} score={scores.ADVANCED} />
          </Stack>
          <Typography component="h2" variant="h2" sx={{ fontSize: 24 }}>{t('planTitle')}</Typography>
          <TextField
            select
            label={t('goalLabel')}
            value={learningGoal}
            onChange={(event) => setLearningGoal(event.target.value as CefrLevel)}
            helperText={t('goalHint')}
          >
            {CEFR_LEVELS.filter((level) => cefrRank(level) >= cefrRank(resultLevel)).map((level) => (
              <MenuItem key={level} value={level}>{level}</MenuItem>
            ))}
          </TextField>
          <Box>
            <Typography sx={{ mb: 1.25, fontWeight: 800 }}>{t('durationLabel')}</Typography>
            <Box role="radiogroup" aria-label={t('durationLabel')} sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {DAILY_STUDY_MINUTES.map((minutes) => {
                const selected = dailyStudyMinutes === minutes
                return (
                  <ButtonBase
                    key={minutes}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDailyStudyMinutes(minutes)}
                    sx={{
                      minHeight: 74,
                      border: '1px solid',
                      borderColor: selected ? 'secondary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: selected ? 'secondary.light' : 'background.paper',
                      fontWeight: 800,
                    }}
                  >
                    {t('minutes', { count: minutes })}
                  </ButtonBase>
                )
              })}
            </Box>
          </Box>
          {updateProfile.isError ? <Alert severity="error">{t('saveError')}</Alert> : null}
          <Button variant="contained" size="large" disabled={updateProfile.isPending} onClick={() => void savePlan()}>
            {updateProfile.isPending ? (
              <><CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />{t('saving')}</>
            ) : t('save')}
          </Button>
        </Stack>
      ) : null}
    </Paper>
  )
}

export function OnboardingPage() {
  const { t } = useTranslation('onboarding')
  const vocabularyQuery = usePlacementVocabularyQuery()

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: { xs: 3, sm: 6 },
        bgcolor: 'background.default',
        backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(29, 126, 145, 0.12), transparent 32%)',
      }}
    >
      {vocabularyQuery.isPending ? (
        <Stack role="status" spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress />
          <Typography>{t('loading')}</Typography>
        </Stack>
      ) : vocabularyQuery.isError ? (
        <Alert
          severity="error"
          action={<Button color="inherit" onClick={() => void vocabularyQuery.refetch()}>{t('retry')}</Button>}
        >
          {t('loadError')}
        </Alert>
      ) : (
        <PlacementExperience entries={vocabularyQuery.data} />
      )}
    </Box>
  )
}
