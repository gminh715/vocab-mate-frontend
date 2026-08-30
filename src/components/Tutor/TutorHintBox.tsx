import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'

interface TutorHintBoxProps {
  meaningVi?: string
  hintUsed: boolean
  onHintReveal: () => void
  disabled?: boolean
}

export function TutorHintBox({
  meaningVi,
  hintUsed,
  onHintReveal,
  disabled = false,
}: TutorHintBoxProps) {
  const { t } = useTranslation('tutor')
  const [isOpen, setIsOpen] = useState(hintUsed)

  if (!meaningVi) return null

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true)
      onHintReveal()
    } else {
      setIsOpen(false)
    }
  }

  return (
    <Box sx={{ my: 2 }}>
      <Button
        size="small"
        variant="outlined"
        color="info"
        onClick={handleToggle}
        disabled={disabled}
        startIcon={<SparklesIcon size={16} />}
        aria-expanded={isOpen}
        sx={{
          borderRadius: 2,
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '0.8125rem',
        }}
      >
        {t('session.hintBtn')}
      </Button>

      <Collapse in={isOpen}>
        <Paper
          variant="outlined"
          sx={{
            mt: 1.5,
            p: 2,
            borderRadius: 2,
            bgcolor: 'info.light',
            borderColor: 'info.main',
            color: 'info.dark',
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              {t('session.hintTitle')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {meaningVi}
            </Typography>
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  )
}
