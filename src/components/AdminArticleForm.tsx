import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  articleFormSchema,
  hasArticleContentChanged,
  toCreateArticleRequest,
  toUpdateArticleRequest,
  type ArticleFormOutput,
  type ArticleFormValues,
} from '../schemas/admin-article'
import type { PublicCategory } from '../types/admin-categories'
import type {
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../types/admin-articles'
import { CEFR_LEVELS } from '../types/auth'
import { ArticleRichTextEditor } from './ArticleRichTextEditor'

interface CreateArticleFormProps {
  mode: 'create'
  categories: PublicCategory[]
  isPending: boolean
  serverError: string | null
  onCancel: () => void
  onSubmit: (request: CreateArticleRequest) => Promise<void>
}

interface EditArticleFormProps {
  mode: 'edit'
  categories: PublicCategory[]
  initialValues: ArticleFormOutput
  isPending: boolean
  serverError: string | null
  onCancel: () => void
  onSubmit: (request: UpdateArticleRequest) => Promise<void>
}

type AdminArticleFormProps = CreateArticleFormProps | EditArticleFormProps

const emptyArticleFormValues: ArticleFormValues = {
  categoryId: '',
  title: '',
  slug: '',
  summary: '',
  cefrLevel: 'B1',
  sourceName: '',
  sourceUrl: '',
  authorName: '',
  thumbnailUrl: '',
  contentHtml: '',
}

export function AdminArticleForm(props: AdminArticleFormProps) {
  const defaultValues =
    props.mode === 'edit'
      ? props.initialValues
      : emptyArticleFormValues
  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    control,
    reset,
    setError,
  } = useForm<ArticleFormValues, unknown, ArticleFormOutput>({
    resolver: zodResolver(articleFormSchema),
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  useEffect(() => {
    if (!isDirty || props.isPending) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty, props.isPending])

  const contentHtml = useWatch({ control, name: 'contentHtml' })
  const contentChanged =
    props.mode === 'edit' &&
    hasArticleContentChanged(
      props.initialValues.contentHtml,
      contentHtml,
    )

  const submit = handleSubmit(async (values) => {
    if (props.mode === 'create') {
      await props.onSubmit(toCreateArticleRequest(values))
      return
    }

    if (props.initialValues.sourceUrl && !values.sourceUrl) {
      setError('sourceUrl', {
        message:
          'The current API cannot clear a saved source URL. Enter a replacement URL.',
      })
      return
    }

    if (props.initialValues.thumbnailUrl && !values.thumbnailUrl) {
      setError('thumbnailUrl', {
        message:
          'The current API cannot clear a saved thumbnail URL. Enter a replacement URL.',
      })
      return
    }

    await props.onSubmit(
      toUpdateArticleRequest(values, props.initialValues),
    )
  })

  return (
    <Box
      component="form"
      onSubmit={submit}
      autoComplete="off"
      noValidate
    >
      <Stack spacing={3}>
        {props.serverError ? (
          <Alert severity="error">{props.serverError}</Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: 25 }}>
                Article identity
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Define how this article is organized and discovered.
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <TextField
                    select
                    label="Category"
                    error={Boolean(errors.categoryId)}
                    helperText={errors.categoryId?.message}
                    {...field}
                  >
                    <MenuItem value="">Choose a category</MenuItem>
                    {props.categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="cefrLevel"
                render={({ field }) => (
                  <TextField
                    select
                    label="CEFR level"
                    error={Boolean(errors.cefrLevel)}
                    helperText={errors.cefrLevel?.message}
                    {...field}
                  >
                    {CEFR_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="Title"
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
                slotProps={{ htmlInput: { maxLength: 300 } }}
                {...register('title')}
              />
              <TextField
                label="Slug"
                error={Boolean(errors.slug)}
                helperText={
                  errors.slug?.message ??
                  'Lowercase letters, numbers, and hyphens.'
                }
                slotProps={{ htmlInput: { maxLength: 200 } }}
                {...register('slug')}
              />
            </Box>
            <TextField
              label="Summary"
              multiline
              minRows={4}
              error={Boolean(errors.summary)}
              helperText={errors.summary?.message}
              slotProps={{ htmlInput: { maxLength: 2_000 } }}
              {...register('summary')}
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: 25 }}>
                Attribution and media
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Optional source details are shown only when supplied.
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="Source name"
                error={Boolean(errors.sourceName)}
                helperText={errors.sourceName?.message}
                slotProps={{ htmlInput: { maxLength: 300 } }}
                {...register('sourceName')}
              />
              <TextField
                label="Source URL"
                type="url"
                error={Boolean(errors.sourceUrl)}
                helperText={errors.sourceUrl?.message}
                slotProps={{ htmlInput: { maxLength: 2_048 } }}
                {...register('sourceUrl')}
              />
              <TextField
                label="Author"
                error={Boolean(errors.authorName)}
                helperText={errors.authorName?.message}
                slotProps={{ htmlInput: { maxLength: 300 } }}
                {...register('authorName')}
              />
              <TextField
                label="Thumbnail URL"
                type="url"
                error={Boolean(errors.thumbnailUrl)}
                helperText={errors.thumbnailUrl?.message}
                slotProps={{ htmlInput: { maxLength: 2_048 } }}
                {...register('thumbnailUrl')}
              />
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, pb: 2 }}>
            <Typography variant="h2" sx={{ fontSize: 25 }}>
              Article content
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Write and format the article here. It will be saved as
              HTML, while the backend remains responsible for
              sanitization and content markers.
            </Typography>
          </Box>
          <Alert severity={contentChanged ? 'warning' : 'info'} square>
            {contentChanged
              ? 'Article HTML has changed. Saving creates a new content version and clears parsed sentence data; parse the content again in Manage content.'
              : 'Modifying article HTML may require parsing the content again before publication.'}
          </Alert>
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Controller
              control={control}
              name="contentHtml"
              render={({ field }) => (
                <ArticleRichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={props.isPending}
                  error={Boolean(errors.contentHtml)}
                  helperText={
                    errors.contentHtml?.message ??
                    'Formatting is saved as HTML. Do not add sentence or term markers manually.'
                  }
                />
              )}
            />
          </Box>
        </Paper>

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'flex-end' }}
        >
          <Button
            type="button"
            color="inherit"
            onClick={props.onCancel}
            disabled={props.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              props.isPending || (props.mode === 'edit' && !isDirty)
            }
          >
            {props.isPending
              ? 'Saving…'
              : props.mode === 'create'
                ? 'Create draft'
                : 'Save changes'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
