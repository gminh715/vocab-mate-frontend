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
import {
  LEARNING_STATUSES,
  type LearningStatus,
  type VocabularyListItem,
} from '@/types/Vocabulary/vocabulary'
import { vocabularyDetailPath } from '@/utils/paths'

const cefrColorMap: Record<string, string> = {
  A1: '#4CAF50',
  A2: '#8BC34A',
  B1: '#FF9800',
  B2: '#ED6C02',
  C1: '#E91E63',
  C2: '#9C27B0',
}

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
  const [deleteTargetItem, setDeleteTargetItem] = useState<VocabularyListItem | null>(null)

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
      <Table aria-label="Saved vocabulary list table">
        <TableHead sx={{ bgcolor: 'background.default' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 750 }}>Word / Lemma</TableCell>
            <TableCell sx={{ fontWeight: 750 }}>CEFR / POS</TableCell>
            <TableCell sx={{ fontWeight: 750 }}>Vietnamese Meaning</TableCell>
            <TableCell sx={{ fontWeight: 750 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 750 }}>Collections</TableCell>
            <TableCell align="right" sx={{ fontWeight: 750 }}>Actions</TableCell>
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
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography
                      component={RouterLink}
                      to={vocabularyDetailPath(item.id)}
                      variant="subtitle2"
                      sx={{
                        color: 'primary.dark',
                        fontWeight: 750,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {item.savedWordDisplay}
                    </Typography>

                    {item.savedLemma !== item.savedWordDisplay ? (
                      <Typography variant="caption" color="text.secondary">
                        Lemma: {item.savedLemma}
                      </Typography>
                    ) : null}

                    {item.savedIpa ? (
                      <Typography variant="caption" color="text.secondary">
                        /{item.savedIpa}/
                      </Typography>
                    ) : null}
                  </Stack>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                      label={item.savedCefrLevel}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: 11,
                        bgcolor: cefrColorMap[item.savedCefrLevel] ?? 'primary.main',
                        color: '#FFFFFF',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {item.savedPartOfSpeech}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.savedMeaningVi}
                    </Typography>

                    {item.personalNote ? (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
                        Note: {item.personalNote}
                      </Typography>
                    ) : null}
                  </Stack>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 125 }}>
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
                        sx={{ fontSize: 13, fontWeight: 700, height: 34 }}
                      >
                        {LEARNING_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {isDue ? (
                      <Chip
                        label="Due"
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 800, fontSize: 10 }}
                      />
                    ) : null}
                  </Stack>
                </TableCell>

                <TableCell>
                  {item.collections.length > 0 ? (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
                      {item.collections.map((col) => (
                        <Chip
                          key={col.id}
                          label={col.name}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 10 }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>

                <TableCell align="right">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      component={RouterLink}
                      to={vocabularyDetailPath(item.id)}
                      size="small"
                      variant="outlined"
                      color="primary"
                    >
                      Details
                    </Button>

                    <Tooltip title="Delete saved word">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTargetItem(item)}
                        disabled={deletingId === item.id}
                        aria-label={`Delete ${item.savedWordDisplay}`}
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
          Remove Saved Vocabulary?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove &quot;{deleteTargetItem?.savedWordDisplay}&quot; from your saved vocabulary list? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTargetItem(null)}>Cancel</Button>
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
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  )
}
