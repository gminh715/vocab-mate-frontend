import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { ReviewSkillBreakdownItem } from '@/types/Review/review'

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
})

interface SkillBreakdownProps {
  items: ReviewSkillBreakdownItem[]
  labelledBy: string
}

export function SkillBreakdown({ items, labelledBy }: SkillBreakdownProps) {
  const { t } = useTranslation('review')

  return (
    <Stack
      component="ul"
      aria-labelledby={labelledBy}
      spacing={2}
      sx={{ m: 0, p: 0, listStyle: 'none' }}
    >
      {items.map((item) => {
        const label = t(`feedback.skills.${item.skillDimension}`)
        return (
          <Box component="li" key={item.skillDimension}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <Typography sx={{ fontWeight: 800 }}>{label}</Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
              >
                {t('summary.skillScore', {
                  correct: item.correct,
                  attempts: item.attempts,
                  accuracy: percentFormatter.format(item.accuracy),
                })}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, item.accuracy * 100))}
              aria-label={t('summary.skillProgressLabel', {
                skill: label,
                accuracy: percentFormatter.format(item.accuracy),
              })}
              sx={{
                mt: 0.75,
                height: 8,
                borderRadius: 999,
                bgcolor: 'divider',
                '& .MuiLinearProgress-bar': { borderRadius: 999 },
              }}
            />
          </Box>
        )
      })}
    </Stack>
  )
}
