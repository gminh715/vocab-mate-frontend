import { useState } from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
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
import type { LearningStatus, VocabularyListItem } from '@/types/Vocabulary/vocabulary'
import { vocabularyDetailPath } from '@/utils/paths'

const statusColorMap: Record<
  LearningStatus,
  'info' | 'warning' | 'secondary' | 'success' | 'default'
> = {
  NEW: 'info',
  LEARNING: 'warning',
  REVIEWING: 'secondary',
  MASTERED: 'success',
  IGNORED: 'default',
}

interface VocabularyItemTableProps {
  items: VocabularyListItem[]
  selectedIds: ReadonlySet<string>
  onToggleSelected: (id: string) => void
  onToggleAll: () => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  deletingId?: string | null
  isBulkDeleting?: boolean
}

export function VocabularyItemTable({
  items,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onDelete,
  onBulkDelete,
  deletingId,
  isBulkDeleting = false,
}: VocabularyItemTableProps) {
  const { t } = useTranslation('vocabulary')
  const [deleteTargetItem, setDeleteTargetItem] = useState<VocabularyListItem | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))
  const someSelected = items.some((item) => selectedIds.has(item.id))

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
      {selectedIds.size > 0 ? (
        <Stack
          direction="row"
          sx={{
            px: 2,
            py: 1.25,
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'rgba(229, 57, 53, 0.06)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {t('table.bulk.selected', { count: selectedIds.size })}
          </Typography>
          <Button
            color="error"
            size="small"
            variant="contained"
            disabled={isBulkDeleting}
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            {t('table.bulk.deleteSelected')}
          </Button>
        </Stack>
      ) : null}

      <Table aria-label={t('table.ariaLabel')}>
        <TableHead sx={{ bgcolor: '#F8F9FA' }}>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onChange={onToggleAll}
                slotProps={{
                  input: { 'aria-label': t('table.bulk.selectAll') },
                }}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colStatus')}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: 13, py: 1.75 }}>
              {t('table.colVocabulary')}
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
                selected={selectedIds.has(item.id)}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleSelected(item.id)}
                    slotProps={{
                      input: {
                        'aria-label': t('table.bulk.selectWord', {
                          word: item.savedWordDisplay,
                        }),
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={{ verticalAlign: 'middle', minWidth: 140 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                      label={t(`statusLabels.${item.learningStatus}`)}
                      size="small"
                      color={statusColorMap[item.learningStatus]}
                      sx={{ fontWeight: 750, fontSize: 11 }}
                    />
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
                        aria-label={t('table.listenAriaLabel', { word: item.savedWordDisplay })}
                      >
                        🔊
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>

                <TableCell sx={{ verticalAlign: 'middle', minWidth: 110 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {item.savedPartOfSpeech || '—'}
                    </Typography>
                    <Chip
                      label={item.savedCefrLevel}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: 10, fontWeight: 800, alignSelf: 'flex-start' }}
                    />
                  </Stack>
                </TableCell>

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
                        disabled={deletingId === item.id || isBulkDeleting}
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
        <DialogTitle id="table-delete-dialog-title">{t('table.dialog.title')}</DialogTitle>
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

      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        aria-labelledby="bulk-delete-dialog-title"
      >
        <DialogTitle id="bulk-delete-dialog-title">
          {t('table.bulk.dialog.title', { count: selectedIds.size })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('table.bulk.dialog.description', { count: selectedIds.size })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>{t('table.dialog.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={isBulkDeleting}
            onClick={() => {
              onBulkDelete([...selectedIds])
              setBulkDeleteDialogOpen(false)
            }}
          >
            {t('table.bulk.dialog.confirm', { count: selectedIds.size })}
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  )
}
