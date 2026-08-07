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
import { z } from 'zod'
import {
  useCreateCollectionMutation,
} from '@/hooks/Vocabulary/useCollections'
import type { CreateCollectionResponse } from '@/api/Vocabulary/CollectionsApi'

const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'nameRequired')
    .max(100, 'nameTooLong'),
  description: z
    .string()
    .trim()
    .max(500, 'descriptionTooLong')
    .optional()
    .or(z.literal('')),
})

type CreateCollectionFormValues = z.input<typeof createCollectionSchema>
type CreateCollectionFormOutput = z.output<typeof createCollectionSchema>

interface CreateCollectionDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: (newCollectionId: string) => void
}

export function CreateCollectionDialog({
  open,
  onClose,
  onSuccess,
}: CreateCollectionDialogProps) {
  const { t } = useTranslation('vocabulary')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const createMutation = useCreateCollectionMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCollectionFormValues, unknown, CreateCollectionFormOutput>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: { name: '', description: '' },
  })

  const handleClose = () => {
    reset()
    setErrorMessage(null)
    onClose()
  }

  const resolveError = (key: string | undefined): string | undefined => {
    if (!key) return undefined
    const knownKeys = ['nameRequired', 'nameTooLong', 'descriptionTooLong'] as const
    type KnownKey = typeof knownKeys[number]
    if ((knownKeys as readonly string[]).includes(key)) {
      return t(`createCollection.${key as KnownKey}`)
    }
    return key
  }

  const onSubmit = (values: CreateCollectionFormOutput) => {
    setErrorMessage(null)
    const payload = {
      name: values.name.trim(),
      ...(values.description?.trim()
        ? { description: values.description.trim() }
        : {}),
    }

    createMutation.mutate(payload, {
      onSuccess: (data: CreateCollectionResponse) => {
        handleClose()
        if (onSuccess) {
          onSuccess(data.collection.id)
        }
      },
      onError: () => {
        setErrorMessage(t('createCollection.errorCreate'))
      },
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle id="create-collection-dialog-title">
        {t('createCollection.dialogTitle')}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              label={t('createCollection.nameLabel')}
              placeholder={t('createCollection.namePlaceholder')}
              fullWidth
              autoFocus
              error={Boolean(errors.name)}
              helperText={resolveError(errors.name?.message)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              {...register('name')}
            />

            <TextField
              label={t('createCollection.descriptionLabel')}
              placeholder={t('createCollection.descriptionPlaceholder')}
              multiline
              rows={3}
              fullWidth
              error={Boolean(errors.description)}
              helperText={resolveError(errors.description?.message)}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              {...register('description')}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting || createMutation.isPending}>
            {t('createCollection.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending ? t('createCollection.creating') : t('createCollection.submit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
