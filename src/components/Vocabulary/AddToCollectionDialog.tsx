import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useAddCollectionItemsMutation, useCollectionsQuery } from '@/hooks/Vocabulary/useCollections'
import type {
  CollectionListItem,
  VocabularyCollectionSummary,
} from '@/types/Vocabulary/vocabulary'

interface AddToCollectionDialogProps {
  open: boolean
  onClose: () => void
  userVocabularyId: string
  existingCollections: VocabularyCollectionSummary[]
}

export function AddToCollectionDialog({
  open,
  onClose,
  userVocabularyId,
  existingCollections,
}: AddToCollectionDialogProps) {
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const { data: collectionsData, isLoading } = useCollectionsQuery({ limit: 100 })
  const addMutation = useAddCollectionItemsMutation()

  const allCollections = collectionsData?.items ?? []
  const existingSet = new Set(existingCollections.map((c) => c.id))

  const handleToggle = (id: string) => {
    setSelectedCollectionIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const handleSubmit = () => {
    if (selectedCollectionIds.length === 0) return

    setFeedback(null)
    // Send each collection addition request
    const promises = selectedCollectionIds.map((collectionId) =>
      addMutation.mutateAsync({
        collectionId,
        userVocabularyIds: [userVocabularyId],
      }),
    )

    Promise.all(promises)
      .then((results) => {
        const totalAdded = results.reduce(
          (acc: number, res: { addedCount: number }) => acc + res.addedCount,
          0,
        )
        const totalSkipped = results.reduce(
          (acc: number, res: { skippedCount: number }) => acc + res.skippedCount,
          0,
        )
        setFeedback({
          type: 'success',
          message: `Added to ${totalAdded} collection(s). ${totalSkipped > 0 ? `(${totalSkipped} already existed)` : ''}`,
        })
        setTimeout(() => {
          onClose()
          setSelectedCollectionIds([])
          setFeedback(null)
        }, 1200)
      })
      .catch(() => {
        setFeedback({
          type: 'error',
          message: 'Failed to add word to collection. Try again.',
        })
      })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="add-to-collection-title"
    >
      <DialogTitle id="add-to-collection-title">
        Add Word to Collection
      </DialogTitle>

      <DialogContent dividers>
        {feedback ? (
          <Alert severity={feedback.type} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        ) : null}

        {isLoading ? (
          <Typography color="text.secondary">Loading collections…</Typography>
        ) : allCollections.length === 0 ? (
          <Typography color="text.secondary">
            You don&apos;t have any collections yet.
          </Typography>
        ) : (
          <List disablePadding>
            {allCollections.map((collection: CollectionListItem) => {
              const isAlreadyMember = existingSet.has(collection.id)
              const isChecked = selectedCollectionIds.includes(collection.id)

              return (
                <ListItem key={collection.id} disablePadding>
                  <ListItemButton
                    disabled={isAlreadyMember || addMutation.isPending}
                    onClick={() => handleToggle(collection.id)}
                    dense
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={isAlreadyMember || isChecked}
                        disabled={isAlreadyMember || addMutation.isPending}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={collection.name}
                      secondary={
                        isAlreadyMember
                          ? 'Already in collection'
                          : collection.description || null
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={addMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={selectedCollectionIds.length === 0 || addMutation.isPending}
        >
          {addMutation.isPending ? 'Adding…' : 'Add Selected'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
