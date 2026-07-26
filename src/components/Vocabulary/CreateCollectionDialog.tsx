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
import { z } from 'zod'
import {
  useCreateCollectionMutation,
} from '@/hooks/Vocabulary/useCollections'
import type { CreateCollectionResponse } from '@/api/Vocabulary/CollectionsApi'

const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Collection name is required.')
    .max(100, 'Name must be 100 characters or fewer.'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
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
        setErrorMessage('Failed to create collection. Name might already exist.')
      },
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle id="create-collection-dialog-title">
        Create New Collection
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              label="Collection Name"
              placeholder="e.g. Technology, Business, Daily Slang…"
              fullWidth
              autoFocus
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              {...register('name')}
            />

            <TextField
              label="Description (optional)"
              placeholder="Short note about what terms belong in this collection…"
              multiline
              rows={3}
              fullWidth
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              {...register('description')}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting || createMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating…' : 'Create Collection'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
