import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import type { AddCollectionItemsResponse } from '@/api/Vocabulary/CollectionsApi'
import type { CollectionListItem } from '@/types/Vocabulary/vocabulary'
import { useAddCollectionItemsMutation, useCollectionsQuery } from '@/hooks/Vocabulary/useCollections'
import { useVocabulariesQuery } from '@/hooks/Vocabulary/useVocabularies'
import { routePaths } from '@/utils/paths'

interface AddVocabularyToCollectionDialogProps {
  open: boolean
  onClose: () => void
  defaultCollectionId?: string
}

export function AddVocabularyToCollectionDialog({
  open,
  onClose,
  defaultCollectionId,
}: AddVocabularyToCollectionDialogProps) {
  const [targetCollectionId, setTargetCollectionId] = useState<string>(
    defaultCollectionId ?? '',
  )
  const [selectedVocabularyIds, setSelectedVocabularyIds] = useState<string[]>([])
  const [searchFilter, setSearchFilter] = useState('')
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const { data: collectionsData } = useCollectionsQuery({ limit: 100 })
  const collections = collectionsData?.items ?? []

  const activeCollectionId = targetCollectionId || (collections[0]?.id ?? '')

  const { data: vocabData, isLoading: isLoadingVocab } = useVocabulariesQuery({
    page: 1,
    limit: 100,
    sort: 'newest',
  })
  const allVocabItems = vocabData?.items ?? []

  const addItemsMutation = useAddCollectionItemsMutation()

  const filteredItems = allVocabItems.filter((item) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    return (
      item.savedWordDisplay.toLowerCase().includes(q) ||
      item.savedLemma.toLowerCase().includes(q) ||
      item.savedMeaningVi.toLowerCase().includes(q)
    )
  })

  const handleToggle = (id: string) => {
    setSelectedVocabularyIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const handleClose = () => {
    setSelectedVocabularyIds([])
    setSearchFilter('')
    setFeedback(null)
    onClose()
  }

  const handleSubmit = () => {
    if (!activeCollectionId || selectedVocabularyIds.length === 0) return

    setFeedback(null)
    addItemsMutation.mutate(
      {
        collectionId: activeCollectionId,
        userVocabularyIds: selectedVocabularyIds,
      },
      {
        onSuccess: (res: AddCollectionItemsResponse) => {
          const added = res.addedCount
          const skipped = res.skippedCount
          setFeedback({
            type: 'success',
            message: `Added ${added} word(s) to collection. ${skipped > 0 ? `(${skipped} already existed)` : ''}`,
          })
          setTimeout(() => {
            handleClose()
          }, 1200)
        },
        onError: () => {
          setFeedback({
            type: 'error',
            message: 'Failed to add words to collection. Try again.',
          })
        },
      },
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle id="add-vocab-dialog-title">
        Add Saved Vocabulary to Collection
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {feedback ? (
            <Alert severity={feedback.type}>{feedback.message}</Alert>
          ) : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="target-collection-label">Target Collection</InputLabel>
              <Select
                labelId="target-collection-label"
                value={activeCollectionId}
                label="Target Collection"
                onChange={(e) => setTargetCollectionId(e.target.value)}
                disabled={addItemsMutation.isPending}
              >
                {collections.map((col: CollectionListItem) => (
                  <MenuItem key={col.id} value={col.id}>
                    {col.name} ({col.vocabularyCount} words)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Filter saved words…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">🔍</InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 320, overflowY: 'auto' }}>
            {isLoadingVocab ? (
              <Stack spacing={1} sx={{ p: 2 }}>
                {[1, 2, 3].map((k) => (
                  <Skeleton key={k} height={40} />
                ))}
              </Stack>
            ) : filteredItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No saved words match your search.
                </Typography>
                <Button
                  component={RouterLink}
                  to={routePaths.articles}
                  onClick={handleClose}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Read Articles to save new terms →
                </Button>
              </Box>
            ) : (
              <List disablePadding dense>
                {filteredItems.map((item) => {
                  const isChecked = selectedVocabularyIds.includes(item.id)
                  const isAlreadyInCollection = item.collections?.some(
                    (c) => c.id === activeCollectionId,
                  )

                  return (
                    <ListItem key={item.id} disablePadding border-bottom="1px solid divider">
                      <ListItemButton
                        disabled={isAlreadyInCollection || addItemsMutation.isPending}
                        onClick={() => handleToggle(item.id)}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={isAlreadyInCollection || isChecked}
                            disabled={isAlreadyInCollection || addItemsMutation.isPending}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                {item.savedWordDisplay}
                              </Typography>
                              {item.savedLemma !== item.savedWordDisplay ? (
                                <Typography variant="caption" color="text.secondary">
                                  ({item.savedLemma})
                                </Typography>
                              ) : null}
                              {isAlreadyInCollection ? (
                                <Chip
                                  label="In Collection"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: 10, height: 18 }}
                                />
                              ) : null}
                            </Stack>
                          }
                          secondary={item.savedMeaningVi}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Want to save new words?
            </Typography>
            <Button
              component={RouterLink}
              to={routePaths.articles}
              onClick={handleClose}
              size="small"
              color="primary"
            >
              Browse Articles →
            </Button>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={addItemsMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={
            selectedVocabularyIds.length === 0 ||
            !activeCollectionId ||
            addItemsMutation.isPending
          }
        >
          {addItemsMutation.isPending ? 'Adding…' : `Add ${selectedVocabularyIds.length} Selected Word(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
