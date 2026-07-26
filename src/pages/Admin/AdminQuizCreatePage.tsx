import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { DebouncedSearchField } from '@/components/Shared/DebouncedSearchField'
import { useAdminArticleListQuery } from '@/hooks/Admin/useAdminArticles'
import { useCreateAdminQuizMutation } from '@/hooks/Admin/useAdminQuizzes'
import {
  quizMetadataSchema,
  toCreateQuizRequest,
  type QuizMetadataValues,
} from '@/schemas/Admin/adminQuiz'
import { adminQuizEditPath, routePaths } from '@/utils/paths'

export function AdminQuizCreatePage() {
  const navigate = useNavigate()
  const [articleSearch, setArticleSearch] = useState('')
  const articlesQuery = useAdminArticleListQuery({
    page: 1,
    limit: 100,
    ...(articleSearch ? { q: articleSearch } : {}),
    sort: 'newest',
  })
  const mutation = useCreateAdminQuizMutation()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<QuizMetadataValues>({
    resolver: zodResolver(quizMetadataSchema),
    defaultValues: { articleId: '', title: '', description: '' },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate(toCreateQuizRequest(values), {
      onSuccess: ({ quiz }) =>
        navigate(adminQuizEditPath(quiz.id), {
          replace: true,
          state: { feedback: 'Draft quiz created. Add the first question.' },
        }),
    })
  })

  return (
    <Stack spacing={3.5} sx={{ maxWidth: 900 }}>
      <Stack spacing={1}>
        <Typography
          sx={{
            color: 'primary.main',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Assessment studio
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 46 } }}>
          Create a quiz draft
        </Typography>
        <Typography color="text.secondary">
          Choose the source article now. The backend keeps that relationship
          fixed after creation.
        </Typography>
      </Stack>

      {articlesQuery.isPending ? (
        <Stack role="status" direction="row" spacing={1.5}>
          <CircularProgress size={24} />
          <Typography>Loading available articles…</Typography>
        </Stack>
      ) : articlesQuery.isError ? (
        <Alert severity="error">
          {normalizeApiError(articlesQuery.error).message}
        </Alert>
      ) : (
        <Paper
          component="form"
          onSubmit={submit}
          variant="outlined"
          sx={{ p: { xs: 2.5, sm: 3.5 }, borderLeft: 4, borderLeftColor: 'secondary.main' }}
          noValidate
        >
          <Stack spacing={2.5}>
            {mutation.isError ? (
              <Alert severity="error">
                {normalizeApiError(mutation.error).details?.[0] ??
                  normalizeApiError(mutation.error).message}
              </Alert>
            ) : null}
            <DebouncedSearchField
              initialValue=""
              label="Find articles"
              placeholder="Search article title or summary…"
              onCommit={setArticleSearch}
            />
            <TextField
              select
              label="Article"
              error={Boolean(errors.articleId)}
              helperText={
                errors.articleId?.message ??
                'Archived articles are unavailable; questions use contextual terms from this article.'
              }
              {...register('articleId')}
            >
              <MenuItem value="">Choose an article</MenuItem>
              {articlesQuery.data?.items
                .filter((article) => article.status !== 'ARCHIVED')
                .map((article) => (
                <MenuItem key={article.id} value={article.id}>
                  {article.title} · {article.status}
                </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Title"
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              slotProps={{ htmlInput: { maxLength: 300 } }}
              {...register('title')}
            />
            <TextField
              label="Description"
              multiline
              minRows={4}
              error={Boolean(errors.description)}
              helperText={errors.description?.message ?? 'Optional'}
              slotProps={{ htmlInput: { maxLength: 2_000 } }}
              {...register('description')}
            />
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button component={RouterLink} to={routePaths.adminQuizzes} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating…' : 'Create draft'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
