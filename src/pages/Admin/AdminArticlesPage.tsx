import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import {
  Link as RouterLink,
  useSearchParams,
} from 'react-router-dom'
import { ArticleClassification } from '../../components/ArticleChips'
import { ConfirmationDialog } from '../../components/ConfirmationDialog'
import { DebouncedSearchField } from '../../components/DebouncedSearchField'
import { normalizeApiError } from '../../config/apiClient'
import {
  useAdminArticleListQuery,
  useDeleteAdminArticleMutation,
} from '../../hooks/useAdminArticles'
import { useAdminCategoryOptionsQuery } from '../../hooks/useAdminCategories'
import type { AdminArticleListItem } from '../../types/admin-articles'
import { ARTICLE_STATUSES } from '../../types/admin-articles'
import { CEFR_LEVELS } from '../../types/auth'
import { adminArticleListParamsFromSearchParams } from '../../utils/adminArticleListParams'
import {
  adminArticleContentPath,
  adminArticleEditPath,
  adminArticlePreviewPath,
  routePaths,
} from '../../utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatDate = (value: string): string =>
  dateFormatter.format(new Date(value))

const errorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

const articleDeleteConflictMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 409) {
    return `${apiError.details?.[0] ?? apiError.message} Used content must be archived rather than deleted.`
  }

  return apiError.details?.[0] ?? apiError.message
}

interface Feedback {
  severity: 'success' | 'error'
  message: string
}

export function AdminArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = adminArticleListParamsFromSearchParams(searchParams)
  const articlesQuery = useAdminArticleListQuery(params)
  const categoriesQuery = useAdminCategoryOptionsQuery()
  const deleteMutation = useDeleteAdminArticleMutation()
  const [deleteArticle, setDeleteArticle] =
    useState<AdminArticleListItem | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const updateSearchParams = (
    updates: Record<string, string | undefined>,
    resetPage = true,
  ) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)

      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })

      if (resetPage) next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams()
      const limit = current.get('limit')
      if (limit) next.set('limit', limit)
      return next
    })
  }

  const openDeleteConfirmation = (article: AdminArticleListItem) => {
    deleteMutation.reset()
    setFeedback(null)
    setDeleteArticle(article)
  }

  const confirmDelete = () => {
    if (!deleteArticle) return

    deleteMutation.mutate(deleteArticle.id, {
      onSuccess: () => {
        setFeedback({
          severity: 'success',
          message: `${deleteArticle.title} deleted.`,
        })
        setDeleteArticle(null)
      },
    })
  }

  const hasFilters = Boolean(
    params.q ||
      params.categoryId ||
      params.cefrLevel ||
      params.status ||
      params.sort !== 'newest',
  )
  const listData = articlesQuery.data

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { sm: 'flex-end' },
          justifyContent: 'space-between',
        }}
      >
        <Stack spacing={1} sx={{ maxWidth: 760 }}>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Editorial desk
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
            Articles
          </Typography>
          <Typography color="text.secondary">
            Prepare article metadata and source HTML before managing parsed
            learning content.
          </Typography>
        </Stack>
        <Button
          component={RouterLink}
          to={routePaths.adminArticleNew}
          variant="contained"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          Create article
        </Button>
      </Stack>

      {feedback ? (
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'minmax(260px, 1.5fr) repeat(4, minmax(150px, 1fr)) auto',
            },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <DebouncedSearchField
            key={params.q ?? ''}
            initialValue={params.q ?? ''}
            label="Search articles"
            placeholder="Search by title or summary…"
            onCommit={(q) =>
              updateSearchParams({ q: q || undefined })
            }
          />
          <TextField
            select
            label="Category"
            value={params.categoryId ?? ''}
            disabled={categoriesQuery.isPending}
            onChange={(event) =>
              updateSearchParams({
                categoryId: event.target.value || undefined,
              })
            }
          >
            <MenuItem value="">All categories</MenuItem>
            {categoriesQuery.data?.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="CEFR level"
            value={params.cefrLevel ?? ''}
            onChange={(event) =>
              updateSearchParams({
                cefrLevel: event.target.value || undefined,
              })
            }
          >
            <MenuItem value="">All CEFR levels</MenuItem>
            {CEFR_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={params.status ?? ''}
            onChange={(event) =>
              updateSearchParams({
                status: event.target.value || undefined,
              })
            }
          >
            <MenuItem value="">All statuses</MenuItem>
            {ARTICLE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status[0] + status.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Sort"
            value={params.sort}
            onChange={(event) =>
              updateSearchParams({ sort: event.target.value })
            }
          >
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
          </TextField>
          {hasFilters ? (
            <Button color="inherit" onClick={clearFilters}>
              Clear
            </Button>
          ) : null}
        </Box>
      </Paper>

      {articlesQuery.isPending ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">
              Loading articles…
            </Typography>
          </Stack>
        </Paper>
      ) : articlesQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => articlesQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {errorMessage(articlesQuery.error)}
        </Alert>
      ) : listData &&
        listData.items.length === 0 &&
        listData.meta.total > 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              No articles on this page
            </Typography>
            <Typography color="text.secondary">
              The selected page is outside the available results.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => updateSearchParams({ page: '1' }, false)}
            >
              Go to first page
            </Button>
          </Stack>
        </Paper>
      ) : listData && listData.items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              {hasFilters ? 'No matching articles' : 'No articles yet'}
            </Typography>
            <Typography color="text.secondary">
              {hasFilters
                ? 'Change or clear the filters to broaden your search.'
                : 'Create the first draft to begin preparing article content.'}
            </Typography>
            {hasFilters ? (
              <Button variant="outlined" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button
                component={RouterLink}
                to={routePaths.adminArticleNew}
                variant="contained"
              >
                Create article
              </Button>
            )}
          </Stack>
        </Paper>
      ) : listData ? (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          {articlesQuery.isFetching ? (
            <LinearProgress aria-label="Refreshing articles" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}
          <TableContainer>
            <Table sx={{ minWidth: 1180 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Article</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Classification</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listData.items.map((article) => (
                  <TableRow key={article.id} hover>
                    <TableCell sx={{ maxWidth: 380 }}>
                      <Typography
                        sx={{ fontWeight: 750, overflowWrap: 'anywhere' }}
                      >
                        {article.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        noWrap
                        title={article.summary}
                        sx={{ mt: 0.5 }}
                      >
                        {article.summary}
                      </Typography>
                      <Typography
                        component="code"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 0.75,
                          fontSize: 12,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        /{article.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>{article.category.name}</TableCell>
                    <TableCell>
                      <ArticleClassification
                        status={article.status}
                        cefrLevel={article.cefrLevel}
                      />
                    </TableCell>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      v{article.contentVersion}
                    </TableCell>
                    <TableCell>{formatDate(article.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.25}
                        sx={{ justifyContent: 'flex-end' }}
                      >
                        {article.status !== 'ARCHIVED' ? (
                          <Button
                            component={RouterLink}
                            to={adminArticleEditPath(article.id)}
                            size="small"
                            aria-label={`Edit ${article.title}`}
                          >
                            Edit
                          </Button>
                        ) : null}
                        <Button
                          component={RouterLink}
                          to={adminArticleContentPath(article.id)}
                          size="small"
                          aria-label={`Manage content for ${article.title}`}
                        >
                          Manage content
                        </Button>
                        {article.status !== 'ARCHIVED' ? (
                          <Button
                            component={RouterLink}
                            to={adminArticlePreviewPath(article.id)}
                            size="small"
                            aria-label={`Preview ${article.title}`}
                          >
                            Preview
                          </Button>
                        ) : null}
                        {article.status === 'DRAFT' ? (
                          <Button
                            size="small"
                            color="error"
                            aria-label={`Delete ${article.title}`}
                            disabled={deleteMutation.isPending}
                            onClick={() => openDeleteConfirmation(article)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={listData.meta.total}
            page={Math.max(0, listData.meta.page - 1)}
            rowsPerPage={listData.meta.limit}
            rowsPerPageOptions={[10, 20, 50, 100]}
            onPageChange={(_, page) =>
              updateSearchParams({ page: String(page + 1) }, false)
            }
            onRowsPerPageChange={(event) =>
              updateSearchParams({ limit: event.target.value })
            }
          />
        </Paper>
      ) : null}

      <ConfirmationDialog
        open={Boolean(deleteArticle)}
        title="Delete draft article"
        description={
          deleteArticle
            ? `Permanently delete ${deleteArticle.title}? Deletion only succeeds when the draft has no reading progress, saved vocabulary, quizzes, or review data.`
            : ''
        }
        confirmLabel="Delete draft"
        isPending={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? articleDeleteConflictMessage(deleteMutation.error)
            : null
        }
        onCancel={() => setDeleteArticle(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}
