import { useState } from 'react'
import Box from '@mui/material/Box'
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
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import {
  LEARNING_STATUSES,
  type LearningStatus,
  type VocabularyListItem,
} from '@/types/Vocabulary/vocabulary'
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

const cefrColorMap: Record<string, string> = {
  A1: '#4CAF50',
  A2: '#8BC34A',
  B1: '#FF9800',
  B2: '#ED6C02',
  C1: '#E91E63',
  C2: '#9C27B0',
}

interface VocabularyItemCardProps {
  item: VocabularyListItem
  onUpdateStatus: (id: string, newStatus: LearningStatus) => void
  onDelete: (id: string) => void
  isUpdating?: boolean
  isDeleting?: boolean
}

export function VocabularyItemCard({
  item,
  onUpdateStatus,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: VocabularyItemCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const isDue =
    item.learningStatus !== 'MASTERED' &&
    item.learningStatus !== 'IGNORED' &&
    (!item.nextReviewAt || new Date(item.nextReviewAt) <= new Date())

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        transition: 'border-color 0.15s ease',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
              <Typography
                component={RouterLink}
                to={vocabularyDetailPath(item.id)}
                variant="h6"
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
                <Typography variant="body2" color="text.secondary">
                  ({item.savedLemma})
                </Typography>
              ) : null}

              {item.savedIpa ? (
                <Typography variant="body2" color="text.secondary">
                  /{item.savedIpa}/
                </Typography>
              ) : null}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {item.savedPartOfSpeech}
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
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

            {isDue ? (
              <Chip
                label="Due"
                size="small"
                color="secondary"
                sx={{ fontWeight: 800, fontSize: 11 }}
              />
            ) : null}
          </Stack>
        </Stack>

        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {item.savedMeaningVi}
        </Typography>

        {item.personalNote ? (
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 2,
              bgcolor: 'background.default',
              borderLeft: '3px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> {item.personalNote}
            </Typography>
          </Box>
        ) : null}

        {item.collections.length > 0 ? (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }} useFlexGap>
            {item.collections.map((col) => (
              <Chip
                key={col.id}
                label={col.name}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11 }}
              />
            ))}
          </Stack>
        ) : null}

        <Stack
          direction="row"
          spacing={1}
          sx={{
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              id={`status-select-${item.id}`}
              value={item.learningStatus}
              disabled={isUpdating}
              onChange={(e) =>
                onUpdateStatus(item.id, e.target.value as LearningStatus)
              }
              sx={{
                fontSize: 13,
                fontWeight: 700,
                height: 34,
              }}
            >
              {LEARNING_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  <Chip
                    label={status}
                    size="small"
                    color={statusColorMap[status]}
                    sx={{ fontWeight: 700, fontSize: 10, mr: 1 }}
                  />
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1}>
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
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                aria-label={`Delete ${item.savedWordDisplay}`}
              >
                🗑️
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby={`delete-dialog-title-${item.id}`}
      >
        <DialogTitle id={`delete-dialog-title-${item.id}`}>
          Remove Saved Vocabulary?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove &quot;{item.savedWordDisplay}&quot; from your saved vocabulary list? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false)
              onDelete(item.id)
            }}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
