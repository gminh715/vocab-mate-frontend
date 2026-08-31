import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayersIcon } from '@/components/Dashboard/DashboardIcons'
import type { FsrsMasteryAnalytics } from '@/types/Analytics/analytics'

const integerFormatter = new Intl.NumberFormat()

interface FsrsMasteryWidgetProps {
  mastery?: FsrsMasteryAnalytics
  isLoading?: boolean
}

export function FsrsMasteryWidget({ mastery, isLoading }: FsrsMasteryWidgetProps) {
  const { t } = useTranslation('home')
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  if (isLoading || !mastery) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 420,
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
          <Skeleton width="40%" height={24} />
          <Skeleton variant="circular" width={36} height={36} />
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Skeleton variant="circular" width={200} height={200} />
        </Box>
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
      </Paper>
    )
  }

  const { total, newCount, learningCount, reviewCount, relearningCount } = mastery

  const segments = [
    {
      key: 'review',
      label: t('masteryWidget.stateReview'),
      count: reviewCount,
      color: '#176B4B',
      bgColor: '#DDF3E8',
    },
    {
      key: 'learning',
      label: t('masteryWidget.stateLearning'),
      count: learningCount,
      color: '#2563EB',
      bgColor: '#DBEAFE',
    },
    {
      key: 'relearning',
      label: t('masteryWidget.stateRelearning'),
      count: relearningCount,
      color: '#E11D48',
      bgColor: '#FFE4E6',
    },
    {
      key: 'new',
      label: t('masteryWidget.stateNew'),
      count: newCount,
      color: '#94A3B8',
      bgColor: '#F1F5F9',
    },
  ]

  // SVG Donut Calculations
  const radius = 86
  const circumference = 2 * Math.PI * radius
  let accumulatedOffset = 0

  const activeSegment = segments.find((s) => s.key === hoveredKey)

  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderTopWidth: 3,
        borderTopColor: '#176B4B',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(23, 107, 75, 0.08)',
        },
      }}
    >
      <Box>
        {/* Header Row */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#DDF3E8',
                color: '#176B4B',
                flexShrink: 0,
              }}
            >
              <LayersIcon size={22} color="#176B4B" />
            </Box>
            <Typography
              component="h3"
              sx={{ fontSize: 16, fontWeight: 800, color: 'text.primary' }}
            >
              {t('masteryWidget.title')}
            </Typography>
          </Stack>
        </Stack>

        {total === 0 ? (
          <Typography
            variant="body2"
            sx={{
              fontSize: 13,
              color: 'text.secondary',
              mb: 1,
            }}
          >
            {t('masteryWidget.empty')}
          </Typography>
        ) : null}

        {/* Pie / Donut Chart Center Area */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            my: { xs: 1, sm: 2 },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: 200, sm: 240 },
              height: { xs: 200, sm: 240 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 240 240"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background circle */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="26"
              />

              {total > 0 ? (
                segments.map((seg) => {
                  if (seg.count === 0) return null
                  const strokeLength = (seg.count / total) * circumference
                  const currentOffset = accumulatedOffset
                  accumulatedOffset += strokeLength

                  const isHovered = hoveredKey === seg.key
                  const strokeWidth = isHovered ? 32 : 26

                  return (
                    <circle
                      key={seg.key}
                      cx="120"
                      cy="120"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                      strokeDashoffset={-currentOffset}
                      style={{
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        cursor: 'pointer',
                        opacity: hoveredKey && !isHovered ? 0.45 : 1,
                      }}
                      onMouseEnter={() => setHoveredKey(seg.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                    />
                  )
                })
              ) : null}
            </svg>

            {/* Center Content in Donut Hole */}
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
                px: 1.5,
              }}
            >
              {activeSegment ? (
                <>
                  <Typography
                    sx={{
                      fontSize: { xs: 26, sm: 32 },
                      fontWeight: 900,
                      color: activeSegment.color,
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {integerFormatter.format(activeSegment.count)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 13 },
                      fontWeight: 700,
                      color: 'text.secondary',
                      maxWidth: 110,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeSegment.label}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    sx={{
                      fontSize: { xs: 28, sm: 34 },
                      fontWeight: 900,
                      color: 'primary.dark',
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {integerFormatter.format(total)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 13 },
                      fontWeight: 700,
                      color: 'text.secondary',
                    }}
                  >
                    {t('masteryWidget.totalWords', { count: total })}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Breakdown Legend Grid */}
      <Box
        sx={{
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1.25,
          }}
        >
          {segments.map((seg) => {
            const isHovered = hoveredKey === seg.key

            return (
              <Tooltip
                key={seg.key}
                title={`${seg.label}: ${integerFormatter.format(seg.count)}`}
                arrow
              >
                <Paper
                  variant="outlined"
                  onMouseEnter={() => setHoveredKey(seg.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  sx={{
                    p: 1.1,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderColor: isHovered ? seg.color : 'divider',
                    bgcolor: isHovered ? seg.bgColor : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    transform: isHovered ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        bgcolor: seg.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      noWrap
                      sx={{
                        fontSize: 12,
                        fontWeight: isHovered ? 800 : 600,
                        color: isHovered ? seg.color : 'text.secondary',
                      }}
                    >
                      {seg.label}
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'text.primary',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {integerFormatter.format(seg.count)}
                  </Typography>
                </Paper>
              </Tooltip>
            )
          })}
        </Box>
      </Box>
    </Card>
  )
}
