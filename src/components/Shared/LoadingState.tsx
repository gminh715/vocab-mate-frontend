import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

export interface LoadingStateProps {
  /** Optional custom loading text, defaults to i18n "Đang tải..." / "Loading..." */
  message?: string
  /** Size of the CircularProgress spinner in px (default: 32) */
  size?: number
  /** Min height for centering (default: 320 for paper, or undefined when minHeight=0) */
  minHeight?: number | string
  /** Wrap in a Paper with variant="outlined" (default: true) */
  paper?: boolean
  /** Vertical padding when minHeight is small or inside dialogs */
  py?: number | string
  /** Additional custom sx for the outer container */
  sx?: SxProps<Theme>
}

export function LoadingState({
  message,
  size = 32,
  minHeight = 320,
  paper = true,
  py,
  sx,
}: LoadingStateProps) {
  const { i18n } = useTranslation()
  const defaultText = i18n.language?.startsWith('en')
    ? 'Loading...'
    : 'Đang tải...'
  const label = message ?? defaultText

  const content = (
    <Stack
      role="status"
      aria-live="polite"
      spacing={1.5}
      sx={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <CircularProgress size={size} aria-hidden="true" />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  )

  const commonSx: SxProps<Theme> = {
    display: 'grid',
    placeItems: 'center',
    ...(minHeight !== undefined && minHeight !== 0 ? { minHeight } : {}),
    ...(py !== undefined ? { py } : {}),
    ...sx,
  }

  if (paper) {
    return (
      <Paper variant="outlined" sx={commonSx}>
        {content}
      </Paper>
    )
  }

  return <Box sx={commonSx}>{content}</Box>
}
