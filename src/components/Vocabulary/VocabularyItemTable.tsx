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
import { useTranslation } from 'react-i18next'
import type { VocabularySnapshot } from '@/types/Vocabulary/vocabulary'

const TABLE_HEADER_HEIGHT = 56
const TABLE_ROW_HEIGHT = 76
const TABLE_VISIBLE_ROWS = 6
const TABLE_VIEWPORT_HEIGHT = TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT * TABLE_VISIBLE_ROWS

interface VocabularyItemTableProps {
  items: VocabularySnapshot[]
  selectedIds: ReadonlySet<string>
  onToggleSelected: (id: string) => void
  onToggleAll: () => void
  onDelete: (id: string) => void
  onViewDetails?: (item: VocabularySnapshot) => void
  deletingId?: string | null
  isBulkDeleting?: boolean
}

export function VocabularyItemTable({
  items,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onDelete,
  onViewDetails,
  deletingId,
  isBulkDeleting = false,
}: VocabularyItemTableProps) {
  const { t } = useTranslation('vocabulary')
  const [deleteTargetItem, setDeleteTargetItem] = useState<VocabularySnapshot | null>(null)
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))
  const someSelected = items.some((item) => selectedIds.has(item.id))

  const playAudio = (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    } catch {
      // Audio speech playback fallback
    }
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 0,
        boxShadow: 'none',
        maxHeight: TABLE_VIEWPORT_HEIGHT,
        overflowY: 'auto',
      }}
    >
      <Table sx={{ minWidth: 650 }} size="medium" stickyHeader>
        <TableHead>
          <TableRow sx={{ height: TABLE_HEADER_HEIGHT }}>
            <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper', zIndex: 3 }}>
              <Checkbox
                indeterminate={someSelected && !allSelected}
                checked={allSelected}
                onChange={onToggleAll}
                slotProps={{
                  input: {
                    'aria-label': t('table.bulk.selectAll'),
                  },
                }}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', zIndex: 2 }}>
              {t('table.columns.word')}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', zIndex: 2 }}>
              {t('table.columns.posCefr')}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', zIndex: 2 }}>
              {t('table.columns.meaning')}
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 800,
                position: 'sticky',
                right: 0,
                zIndex: 4,
                bgcolor: 'background.paper',
              }}
            >
              {t('table.columns.actions')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            return (
              <TableRow
                key={item.id}
                hover
                selected={selectedIds.has(item.id)}
                sx={{
                  height: TABLE_ROW_HEIGHT,
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
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

                <TableCell sx={{ verticalAlign: 'middle' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Typography
                      component="button"
                      type="button"
                      onClick={() => onViewDetails?.(item)}
                      variant="subtitle1"
                      noWrap
                      sx={{
                        minWidth: 0,
                        color: 'text.primary',
                        fontWeight: 800,
                        textDecoration: 'none',
                        background: 'none',
                        border: 'none',
                        p: 0,
                        font: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                        '&:hover': { color: 'primary.main', textDecoration: 'underline' },
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

                <TableCell sx={{ verticalAlign: 'middle' }}>
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

                <TableCell sx={{ verticalAlign: 'middle' }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {item.savedMeaningVi}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    position: 'sticky',
                    right: 0,
                    zIndex: 1,
                    bgcolor: selectedIds.has(item.id) ? 'action.selected' : 'background.paper',
                    verticalAlign: 'middle',
                  }}
                >
                  <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                    <Tooltip title={t('table.detailsTooltip')}>
                      <IconButton
                        onClick={() => onViewDetails?.(item)}
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
    </TableContainer>
  )
}
