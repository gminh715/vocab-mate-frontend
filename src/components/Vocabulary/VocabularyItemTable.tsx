import { useState } from 'react'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LEARNING_STATUSES,
  type LearningStatus,
  type VocabularyListItem,
} from '@/types/Vocabulary/vocabulary'
import { vocabularyDetailPath } from '@/utils/paths'

interface VocabularyItemTableProps {
  items: VocabularyListItem[]
  onUpdateStatus: (id: string, newStatus: LearningStatus) => void
  onDelete: (id: string) => void
  updatingId?: string | null
  deletingId?: string | null
}

export function VocabularyItemTable({
  items,
  onUpdateStatus,
  onDelete,
  updatingId,
  deletingId,
}: VocabularyItemTableProps) {
  const { t } = useTranslation('vocabulary')
  const [deleteTargetItem, setDeleteTargetItem] = useState<VocabularyListItem | null>(null)

  const playAudio = (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    } catch {
      // Audio playback is optional
    }
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Table aria-label={t('table.ariaLabel')}>
        <TableHead sx={{ bgcolor: '#F8F9FA' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colStatus')}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colVocabulary')}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colPhonetic')}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colPos')}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colMeaning')}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colActions')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const isDue =
              item.learningStatus !== 'MASTERED' &&
              item.learningStatus !== 'IGNORED' &&
              (!item.nextReviewAt || new Date(item.nextReviewAt) <= new Date())

            return (
              <TableRow
                key={item.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {/* 1. Status Dropdown Pill */}
                <TableCell sx={{ verticalAlign: 'middle', minWidth: 140 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <FormControl size="small" fullWidth>
                      <Select
                        id={`table-status-select-${item.id}`}
                        value={item.learningStatus}
                        disabled={updatingId === item.id}
                        onChange={(e) =>
                          onUpdateStatus(
                            item.id,
                            e.target.value as LearningStatus,
                          )
                        }
                        sx={{
                          fontSize: 13,
                          fontWeight: 750,
                          height: 34,
                          borderRadius: 5,
                          bgcolor: '#F3F4F6',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'transparent',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'divider',
                          },
                        }}
                      >
                        {LEARNING_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {t(`statusLabels.${status}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {isDue ? (
                      <Chip
                        label={t('table.dueChip')}
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 800, fontSize: 10 }}
                      />
                    ) : null}
                  </Stack>
                </TableCell>

                {/* 2. Vocabulary Word + Audio */}
                <TableCell sx={{ verticalAlign: 'middle', minWidth: 150 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography
                      component={RouterLink}
                      to={vocabularyDetailPath(item.id)}
                      variant="subtitle1"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 800,
                        textDecoration: 'none',
                        '&:hover': { color: '#E53935' },
                      }}
                    >
                      {item.savedWordDisplay}
                    </Typography>

                    <Tooltip title={t('table.listenTooltip')}>
                      <IconButton
                        size="small"
                        onClick={() => playAudio(item.savedWordDisplay)}
                        sx={{
                          color: '#E53935',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(229, 57, 53, 0.08)' },
                        }}
                      >
                        🔊
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>

                {/* 3. Phonetic / Lemma */}
                <TableCell sx={{ verticalAlign: 'middle', minWidth: 120 }}>
                  <Typography variant="body2" color="text.secondary">
                    {item.savedIpa
                      ? `/${item.savedIpa}/`
                      : item.savedLemma !== item.savedWordDisplay
                        ? item.savedLemma
                        : '—'}
                  </Typography>
                </TableCell>

                {/* 4. POS / CEFR Level */}
                <TableCell sx={{ verticalAlign: 'middle', minWidth: 110 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {item.savedPartOfSpeech || '—'}
                    </Typography>
                    {item.savedCefrLevel ? (
                      <Chip
                        label={item.savedCefrLevel}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 800,
                          alignSelf: 'flex-start',
                        }}
                      />
                    ) : null}
                  </Stack>
                </TableCell>

                {/* 5. Meaning & Context Examples */}
                <TableCell sx={{ verticalAlign: 'middle', minWidth: 240 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {item.savedMeaningVi}
                    </Typography>

                    {item.personalNote ? (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
                        {t('table.notePrefix')}{item.personalNote}
                      </Typography>
                    ) : null}
                  </Stack>
                </TableCell>

                {/* 6. Action Icon Buttons */}
                <TableCell align="right" sx={{ verticalAlign: 'middle', minWidth: 100 }}>
                  <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                    <Tooltip title={t('table.detailsTooltip')}>
                      <IconButton
                        component={RouterLink}
                        to={vocabularyDetailPath(item.id)}
                        size="small"
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                        aria-label={t('table.detailsAriaLabel', { word: item.savedWordDisplay })}
                      >
                        ✏️
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={t('table.deleteTooltip')}>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTargetItem(item)}
                        disabled={deletingId === item.id}
                        sx={{ color: 'text.secondary', '&:hover': { color: '#E53935' } }}
                        aria-label={t('table.deleteAriaLabel', { word: item.savedWordDisplay })}
                      >
                        🗑️
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog
        open={Boolean(deleteTargetItem)}
        onClose={() => setDeleteTargetItem(null)}
        aria-labelledby="table-delete-dialog-title"
      >
        <DialogTitle id="table-delete-dialog-title">
          {t('table.dialog.title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('table.dialog.description', { word: deleteTargetItem?.savedWordDisplay ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTargetItem(null)}>{t('table.dialog.cancel')}</Button>
          <Button
            onClick={() => {
              if (deleteTargetItem) {
                onDelete(deleteTargetItem.id)
                setDeleteTargetItem(null)
              }
            }}
            color="error"
            variant="contained"
          >
            {t('table.dialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  )
}
