import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useUpdateCollectionMutation } from '@/hooks/Vocabulary/useCollections'
import {
  collectionNameSchema,
  type CollectionNameFormOutput,
  type CollectionNameFormValues,
} from '@/schemas/Vocabulary/vocabulary'
import type { VocabularyCollection } from '@/types/Vocabulary/vocabulary'

interface RenameCollectionDialogProps {
  collection: VocabularyCollection
  onClose: () => void
}

export function RenameCollectionDialog({
  collection,
  onClose,
}: RenameCollectionDialogProps) {
  const { t } = useTranslation('vocabulary')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const updateMutation = useUpdateCollectionMutation(collection.id)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionNameFormValues, unknown, CollectionNameFormOutput>({
    resolver: zodResolver(collectionNameSchema),
    defaultValues: { name: collection.name },
  })

  const isPending = isSubmitting || updateMutation.isPending

  const resolveError = (key: string | undefined): string | undefined => {
    if (key === 'nameRequired' || key === 'nameTooLong') {
      return t(`renameCollection.${key}`)
    }
    return key
  }

  const handleClose = () => {
    if (isPending) return
    onClose()
  }

  const onSubmit = (values: CollectionNameFormOutput) => {
    setErrorMessage(null)
    updateMutation.mutate(
      { name: values.name },
      {
        onSuccess: onClose,
        onError: () => setErrorMessage(t('renameCollection.errorUpdate')),
      },
    )
  }

  return (
    <Dialog open onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle id="rename-collection-dialog-title">
        {t('renameCollection.dialogTitle')}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            <TextField
              label={t('renameCollection.nameLabel')}
              fullWidth
              autoFocus
              error={Boolean(errors.name)}
              helperText={resolveError(errors.name?.message)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              {...register('name')}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={isPending}>
            {t('renameCollection.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending
              ? t('renameCollection.saving')
              : t('renameCollection.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
