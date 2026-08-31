import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlameIcon,
} from '@/components/Dashboard/DashboardIcons'
import type { StreakAnalytics } from '@/types/Analytics/analytics'

const integerFormatter = new Intl.NumberFormat()

interface StreakWidgetProps {
  streak?: StreakAnalytics
  isLoading?: boolean
}

interface CalendarCell {
  dayNumber: number
  dateStr: string
  isCurrentMonth: boolean
  isCompleted: boolean
  isToday: boolean
  isFuture: boolean
}

export function StreakWidget({ streak, isLoading }: StreakWidgetProps) {
  const { t, i18n } = useTranslation('home')

  const now = useMemo(() => new Date(), [])
  const [viewDate, setViewDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))

  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth()
  const todayDate = now.getDate()
  const todayStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`

  const currentViewYear = viewDate.getFullYear()
  const currentViewMonth = viewDate.getMonth()
  const isViewingCurrentMonth = currentViewYear === todayYear && currentViewMonth === todayMonth

  const completedDatesSet = useMemo(() => {
    const set = new Set<string>()
    if (streak?.completedDates) {
      streak.completedDates.forEach((d) => set.add(d))
    }
    if (streak?.recentDays) {
      streak.recentDays.forEach((d) => {
        if (d.isCompleted) set.add(d.date)
      })
    }
    return set
  }, [streak])

  // Calendar cells generation
  const cells = useMemo(() => {
    const firstDay = new Date(currentViewYear, currentViewMonth, 1)
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0, Sunday = 6
    const daysInCurrentMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentViewYear, currentViewMonth, 0).getDate()

    const result: CalendarCell[] = []

    // 1. Previous month padding days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const prevDate = new Date(currentViewYear, currentViewMonth - 1, day)
      const y = prevDate.getFullYear()
      const m = String(prevDate.getMonth() + 1).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      result.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        isCompleted: completedDatesSet.has(dateStr),
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      })
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const y = currentViewYear
      const m = String(currentViewMonth + 1).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      result.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isCompleted: completedDatesSet.has(dateStr),
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      })
    }

    // 3. Next month padding days to always have a fixed 6 rows (42 cells)
    const FIXED_TOTAL_CELLS = 42
    const nextMonthPadding = FIXED_TOTAL_CELLS - result.length
    for (let day = 1; day <= nextMonthPadding; day++) {
      const nextDate = new Date(currentViewYear, currentViewMonth + 1, day)
      const y = nextDate.getFullYear()
      const m = String(nextDate.getMonth() + 1).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      result.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        isCompleted: completedDatesSet.has(dateStr),
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      })
    }

    return result
  }, [currentViewYear, currentViewMonth, completedDatesSet, todayStr])

  const handlePrevMonth = () => {
    setViewDate(new Date(currentViewYear, currentViewMonth - 1, 1))
  }

  const handleNextMonth = () => {
    if (!isViewingCurrentMonth) {
      setViewDate(new Date(currentViewYear, currentViewMonth + 1, 1))
    }
  }

  const handleResetCurrentMonth = () => {
    setViewDate(new Date(todayYear, todayMonth, 1))
  }

  const monthTitle = useMemo(() => {
    const formatted = new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(viewDate)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }, [viewDate, i18n.language])

  const weekdayLabels = [
    t('streakWidget.dayMon'),
    t('streakWidget.dayTue'),
    t('streakWidget.dayWed'),
    t('streakWidget.dayThu'),
    t('streakWidget.dayFri'),
    t('streakWidget.daySat'),
    t('streakWidget.daySun'),
  ]

  if (isLoading || !streak) {
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
        <Skeleton width="60%" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
      </Paper>
    )
  }

  const { currentStreak, longestStreak } = streak

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
        borderTopColor: '#ea580c',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(234, 88, 12, 0.08)',
        },
      }}
    >
      <Box>
        {/* Header Row */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
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
                bgcolor: '#ffedd5',
                color: '#ea580c',
                flexShrink: 0,
              }}
            >
              <FlameIcon size={22} color="#ea580c" />
            </Box>
            <Box>
              <Typography
                component="h3"
                sx={{ fontSize: 16, fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}
              >
                {t('streakWidget.title')}
              </Typography>
              {longestStreak > 0 ? (
                <Typography
                  variant="caption"
                  sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}
                >
                  {t('streakWidget.longestStreak', {
                    count: integerFormatter.format(longestStreak),
                  })}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          {/* Streak Numbers on the Right */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            <Typography
              sx={{
                fontSize: { xs: 26, sm: 32 },
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: currentStreak > 0 ? '#c2410c' : 'text.primary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {integerFormatter.format(currentStreak)}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {t('streakWidget.daysUnit')}
            </Typography>
          </Stack>
        </Stack>

        {/* Month Navigation Bar */}
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: 'text.primary' }}>
              {monthTitle}
            </Typography>
            {!isViewingCurrentMonth ? (
              <Button
                size="small"
                variant="text"
                onClick={handleResetCurrentMonth}
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  py: 0.25,
                  px: 1,
                  minHeight: 24,
                  borderRadius: 1.5,
                }}
              >
                {t('streakWidget.currentMonthBtn')}
              </Button>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={handlePrevMonth}
              aria-label={t('streakWidget.prevMonth')}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ChevronLeftIcon size={16} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNextMonth}
              disabled={isViewingCurrentMonth}
              aria-label={t('streakWidget.nextMonth')}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                opacity: isViewingCurrentMonth ? 0.3 : 1,
              }}
            >
              <ChevronRightIcon size={16} />
            </IconButton>
          </Stack>
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ width: '100%' }}>
          {/* Weekdays Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 0.75,
              textAlign: 'center',
            }}
          >
            {weekdayLabels.map((lbl, idx) => (
              <Typography
                key={idx}
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'text.secondary',
                }}
              >
                {lbl}
              </Typography>
            ))}
          </Box>

          {/* Days Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              textAlign: 'center',
            }}
          >
            {cells.map((cell, idx) => {
              const { dayNumber, dateStr, isCurrentMonth: inCurrentMonth, isCompleted, isToday, isFuture } = cell

              const tooltipText = `${dateStr}${isToday ? ` (${t('streakWidget.dayToday')})` : ''}: ${
                isCompleted
                  ? t('streakWidget.todayCompleted')
                  : isFuture
                    ? ''
                    : t('streakWidget.todayPending')
              }`

              return (
                <Tooltip key={idx} title={tooltipText} arrow disableHoverListener={isFuture && !isToday}>
                  <Box
                    sx={{
                      height: { xs: 28, sm: 32 },
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      fontSize: { xs: 11, sm: 12 },
                      fontWeight: isToday ? 800 : inCurrentMonth ? 600 : 400,
                      color: isCompleted
                        ? '#ffffff'
                        : isToday
                          ? 'primary.main'
                          : inCurrentMonth && !isFuture
                            ? 'text.primary'
                            : 'text.disabled',
                      bgcolor: isCompleted
                        ? '#16a34a'
                        : isToday
                          ? '#ffedd5'
                          : inCurrentMonth
                            ? 'transparent'
                            : 'transparent',
                      border: isToday
                        ? isCompleted
                          ? '2px solid #15803d'
                          : '2px dashed #ea580c'
                        : '1px solid transparent',
                      transition: 'all 0.15s ease-in-out',
                      cursor: inCurrentMonth ? 'pointer' : 'default',
                      opacity: inCurrentMonth ? 1 : 0.35,
                      '&:hover': inCurrentMonth && !isFuture
                        ? {
                            bgcolor: isCompleted ? '#15803d' : 'action.hover',
                            transform: 'scale(1.1)',
                            zIndex: 1,
                          }
                        : {},
                    }}
                  >
                    {isCompleted ? (
                      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircleIcon size={14} color="#ffffff" />
                      </Stack>
                    ) : (
                      dayNumber
                    )}
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        </Box>
      </Box>

      {/* Month Study Summary Footer */}
      <Box
        sx={{
          mt: 2,
          pt: 1.25,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a' }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
              {t('streakWidget.todayCompleted')}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: '1px dashed #ea580c',
                bgcolor: '#ffedd5',
              }}
            />
            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
              {t('streakWidget.dayToday')}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Card>
  )
}
