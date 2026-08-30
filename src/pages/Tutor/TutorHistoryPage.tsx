import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import { TutorHistoryItemCard } from '@/components/Tutor/TutorHistoryItemCard'
import { useTutorHistoryQuery } from '@/hooks/Tutor/useTutor'
import type { TutorSessionSummary } from '@/types/Tutor/tutor'
import { routePaths } from '@/utils/paths'

export function TutorHistoryPage() {
  const { t } = useTranslation('tutor')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [accumulatedItems, setAccumulatedItems] = useState<
    TutorSessionSummary[]
  >([])

  const { data, isPending, isError, refetch, isFetching } =
    useTutorHistoryQuery(
      { cursor, limit: 10 },
      true,
    )

  // Merge items when data updates
  const items = data?.items ?? []
  const allItems = cursor ? [...accumulatedItems, ...items] : items
  const hasMore = data?.hasMore ?? false
  const nextCursor = data?.nextCursor

  const handleLoadMore = () => {
    if (nextCursor && !isFetching) {
      setAccumulatedItems(allItems)
      setCursor(nextCursor)
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: { xs: 2, sm: 4 } }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
        >
          {t('history.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('history.subtitle')}
        </Typography>
      </Stack>

      {isPending && !cursor ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 8,
            gap: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            {t('history.loading')}
          </Typography>
        </Box>
      ) : isError ? (
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
      ) : allItems.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 5,
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              mx: 'auto',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.light',
              color: 'primary.main',
            }}
          >
            <SparklesIcon size={28} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {t('history.emptyTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 460, mx: 'auto' }}>
            {t('history.emptyDesc')}
          </Typography>
          <Button
            component={RouterLink}
            to={routePaths.tutorSession}
            variant="contained"
            size="large"
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {t('history.startFirstSession')}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {allItems.map((session) => (
            <TutorHistoryItemCard key={session.id} session={session} />
          ))}

          {hasMore ? (
            <Box sx={{ textAlign: 'center', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={isFetching}
                size="large"
                sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
              >
                {isFetching ? (
                  <CircularProgress size={24} />
                ) : (
                  t('history.loadMore')
                )}
              </Button>
            </Box>
          ) : null}
        </Stack>
      )}
    </Box>
  )
}
