import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { normalizeApiError } from '../config/apiClient'
import {
  categoryFormSchema,
  toCreateCategoryRequest,
  toUpdateCategoryRequest,
  type CategoryFormOutput,
  type CategoryFormValues,
} from '../schemas/admin-category'
import type {
  AdminCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/admin-categories'

interface CreateCategoryFormDialogProps {
  mode: 'create'
  onClose: () => void
  onSubmit: (request: CreateCategoryRequest) => Promise<void>
}

interface EditCategoryFormDialogProps {
  mode: 'edit'
  category: AdminCategory
  articleCount: number
  onClose: () => void
  onSubmit: (request: UpdateCategoryRequest) => Promise<void>
}

type CategoryFormDialogProps =
  | CreateCategoryFormDialogProps
  | EditCategoryFormDialogProps

const createDefaults: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
  isActive: true,
  displayOrder: 0,
}

const editDefaults = (category: AdminCategory): CategoryFormValues => ({
  name: category.name,
  slug: category.slug,
  description: category.description ?? '',
  isActive: category.isActive,
  displayOrder: category.displayOrder,
})

export function CategoryFormDialog(props: CategoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues, unknown, CategoryFormOutput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues:
      props.mode === 'create'
        ? createDefaults
        : editDefaults(props.category),
  })

  const submit = handleSubmit(async (values) => {
    try {
      if (props.mode === 'create') {
        await props.onSubmit(toCreateCategoryRequest(values))
      } else {
        await props.onSubmit(toUpdateCategoryRequest(values))
      }
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)
      const message = apiError.details?.[0] ?? apiError.message

      if (apiError.status === 409) {
        setError('slug', { type: 'server', message }, { shouldFocus: true })
      } else {
        setError('root', { type: 'server', message })
      }
    }
  })

  return (
    <Dialog
      open
      onClose={isSubmitting ? undefined : props.onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="category-form-title"
    >
      <DialogTitle id="category-form-title">
        {props.mode === 'create' ? 'Create category' : 'Edit category'}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="category-form"
          onSubmit={submit}
          noValidate
          spacing={2.5}
          sx={{ pt: 1 }}
        >
          {props.mode === 'edit' ? (
            <Alert severity="info">
              This category is used by {props.articleCount}{' '}
              {props.articleCount === 1 ? 'article' : 'articles'}.
            </Alert>
          ) : null}
          {errors.root?.message ? (
            <Alert severity="error">{errors.root.message}</Alert>
          ) : null}
          <TextField
            label="Name"
            autoFocus
            autoComplete="off"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            slotProps={{ htmlInput: { maxLength: 100 } }}
            {...register('name')}
          />
          <TextField
            label="Slug"
            autoComplete="off"
            placeholder="technology"
            error={Boolean(errors.slug)}
            helperText={
              errors.slug?.message ??
              'Use lowercase letters, numbers, and hyphens.'
            }
            slotProps={{ htmlInput: { maxLength: 200 } }}
            {...register('slug')}
          />
          <TextField
            label="Description"
            multiline
            minRows={3}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            {...register('description')}
          />
          <TextField
            label="Display order"
            type="number"
            error={Boolean(errors.displayOrder)}
            helperText={
              errors.displayOrder?.message ??
              'Lower numbers appear first.'
            }
            slotProps={{
              htmlInput: {
                min: 0,
                max: 2_147_483_647,
                step: 1,
              },
            }}
            {...register('displayOrder', { valueAsNumber: true })}
          />
          {props.mode === 'create' ? (
            <FormControlLabel
              control={<Checkbox {...register('isActive')} />}
              label="Active and available for article assignment"
            />
          ) : (
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              Activation is managed separately from category details.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={props.onClose}
          color="inherit"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="category-form"
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving…'
            : props.mode === 'create'
              ? 'Create category'
              : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
