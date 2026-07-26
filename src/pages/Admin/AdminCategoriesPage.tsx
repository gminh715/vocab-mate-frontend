import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
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
import { useSearchParams } from 'react-router-dom'
import { CategoryFormDialog } from '@/components/Admin/CategoryFormDialog'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import { DebouncedSearchField } from '@/components/Shared/DebouncedSearchField'
import { normalizeApiError } from '@/config/apiClient'
import {
  useAdminCategoryDetailQuery,
  useAdminCategoryListQuery,
  useCreateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useUpdateAdminCategoryStatusMutation,
} from '@/hooks/Admin/useAdminCategories'
import type {
  AdminCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/Admin/adminCategories'
import { adminCategoryListParamsFromSearchParams } from '@/utils/Admin/adminCategoryListParams'

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

interface CreateCategoryDialogProps {
  onClose: () => void
  onSaved: (message: string) => void
}

function CreateCategoryDialog({
  onClose,
  onSaved,
}: CreateCategoryDialogProps) {
  const mutation = useCreateAdminCategoryMutation()

  const submit = async (request: CreateCategoryRequest) => {
    await mutation.mutateAsync(request)
    onSaved('Category created.')
    onClose()
  }

  return (
    <CategoryFormDialog
      mode="create"
      onClose={onClose}
      onSubmit={submit}
    />
  )
}

interface EditCategoryDialogProps {
  categoryId: string
  onClose: () => void
  onSaved: (message: string) => void
}

function EditCategoryDialog({
  categoryId,
  onClose,
  onSaved,
}: EditCategoryDialogProps) {
  const detailQuery = useAdminCategoryDetailQuery(categoryId)
  const mutation = useUpdateAdminCategoryMutation(categoryId)

  if (detailQuery.isPending) {
    return (
      <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit category</DialogTitle>
        <DialogContent>
          <Stack
            role="status"
            spacing={1.5}
            sx={{ alignItems: 'center', py: 6 }}
          >
            <CircularProgress size={32} />
            <Typography color="text.secondary">
              Loading category…
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    )
  }

  if (detailQuery.isError) {
    return (
      <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit category</DialogTitle>
        <DialogContent>
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => detailQuery.refetch()}>
                Try again
              </Button>
            }
          >
            {errorMessage(detailQuery.error)}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    )
  }

  const submit = async (request: UpdateCategoryRequest) => {
    await mutation.mutateAsync(request)
    onSaved('Category details updated.')
    onClose()
  }

  return (
    <CategoryFormDialog
      mode="edit"
      category={detailQuery.data.category}
      articleCount={detailQuery.data.articleCount}
      onClose={onClose}
      onSubmit={submit}
    />
  )
}

interface Feedback {
  severity: 'success' | 'error'
  message: string
}

export function AdminCategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = adminCategoryListParamsFromSearchParams(searchParams)
  const categoriesQuery = useAdminCategoryListQuery(params)
  const statusMutation = useUpdateAdminCategoryStatusMutation()
  const deleteMutation = useDeleteAdminCategoryMutation()
  const [isCreating, setIsCreating] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<
    string | null
  >(null)
  const [statusCategory, setStatusCategory] =
    useState<AdminCategory | null>(null)
  const [deleteCategory, setDeleteCategory] =
    useState<AdminCategory | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const updateSearchParams = (
    updates: Record<string, string | undefined>,
    resetPage = true,
  ) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          next.set(key, value)
        } else {
          next.delete(key)
        }
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

  const handleStatusAction = (category: AdminCategory) => {
    statusMutation.reset()
    setFeedback(null)

    if (category.isActive) {
      setStatusCategory(category)
      return
    }

    statusMutation.mutate(
      { categoryId: category.id, isActive: true },
      {
        onSuccess: () => {
          setFeedback({
            severity: 'success',
            message: `${category.name} activated.`,
          })
        },
        onError: (error) => {
          setFeedback({ severity: 'error', message: errorMessage(error) })
        },
      },
    )
  }

  const confirmDeactivation = () => {
    if (!statusCategory) return

    statusMutation.mutate(
      { categoryId: statusCategory.id, isActive: false },
      {
        onSuccess: () => {
          setFeedback({
            severity: 'success',
            message: `${statusCategory.name} deactivated.`,
          })
          setStatusCategory(null)
        },
      },
    )
  }

  const openDeleteConfirmation = (category: AdminCategory) => {
    deleteMutation.reset()
    setFeedback(null)
    setDeleteCategory(category)
  }

  const confirmDelete = () => {
    if (!deleteCategory) return

    deleteMutation.mutate(deleteCategory.id, {
      onSuccess: () => {
        setFeedback({
          severity: 'success',
          message: `${deleteCategory.name} deleted.`,
        })
        setDeleteCategory(null)
      },
    })
  }

  const deleteError = deleteMutation.isError
    ? normalizeApiError(deleteMutation.error)
    : null
  const deleteErrorMessage = deleteError
    ? deleteError.status === 409
      ? `${deleteError.details?.[0] ?? deleteError.message} Deactivate the category instead to preserve its article references.`
      : deleteError.details?.[0] ?? deleteError.message
    : null
  const hasFilters = Boolean(
    params.q || params.isActive !== undefined,
  )
  const listData = categoriesQuery.data

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
        <Stack spacing={1} sx={{ maxWidth: 720 }}>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Content taxonomy
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
            Categories
          </Typography>
          <Typography color="text.secondary">
            Organize articles into stable, reusable browsing groups.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          onClick={() => {
            setFeedback(null)
            setIsCreating(true)
          }}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          Create category
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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { md: 'center' } }}
        >
          <DebouncedSearchField
            key={params.q ?? ''}
            initialValue={params.q ?? ''}
            label="Search categories"
            placeholder="Category name"
            onCommit={(q) =>
              updateSearchParams({ q: q || undefined })
            }
          />
          <TextField
            select
            label="Status"
            value={
              params.isActive === undefined
                ? ''
                : String(params.isActive)
            }
            onChange={(event) =>
              updateSearchParams({
                isActive: event.target.value || undefined,
              })
            }
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All categories</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
          {hasFilters ? (
            <Button
              color="inherit"
              onClick={clearFilters}
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
            >
              Clear filters
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {categoriesQuery.isPending ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">
              Loading categories…
            </Typography>
          </Stack>
        </Paper>
      ) : categoriesQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => categoriesQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {errorMessage(categoriesQuery.error)}
        </Alert>
      ) : listData &&
        listData.items.length === 0 &&
        listData.meta.total > 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              No categories on this page
            </Typography>
            <Typography color="text.secondary">
              The selected page is outside the available results.
            </Typography>
            <Button
              variant="outlined"
              onClick={() =>
                updateSearchParams({ page: '1' }, false)
              }
            >
              Go to first page
            </Button>
          </Stack>
        </Paper>
      ) : listData && listData.items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              {hasFilters ? 'No matching categories' : 'No categories yet'}
            </Typography>
            <Typography color="text.secondary">
              {hasFilters
                ? 'Change or clear the filters to broaden your search.'
                : 'Create the first category to begin organizing articles.'}
            </Typography>
            {hasFilters ? (
              <Button variant="outlined" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setIsCreating(true)}
              >
                Create category
              </Button>
            )}
          </Stack>
        </Paper>
      ) : listData ? (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          {categoriesQuery.isFetching ? (
            <LinearProgress aria-label="Refreshing categories" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}
          <TableContainer>
            <Table sx={{ minWidth: 1080 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Display order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listData.items.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>
                        {category.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        component="code"
                        sx={{ color: 'text.secondary', fontSize: 13 }}
                      >
                        {category.slug}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography
                        color="text.secondary"
                        noWrap
                        title={category.description ?? undefined}
                      >
                        {category.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {category.displayOrder}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        color={category.isActive ? 'success' : 'default'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(category.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: 'flex-end' }}
                      >
                        <Button
                          size="small"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => setEditingCategoryId(category.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          aria-label={`${category.isActive ? 'Deactivate' : 'Activate'} ${category.name}`}
                          disabled={
                            statusMutation.isPending ||
                            deleteMutation.isPending
                          }
                          onClick={() => handleStatusAction(category)}
                        >
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          aria-label={`Delete ${category.name}`}
                          disabled={
                            statusMutation.isPending ||
                            deleteMutation.isPending
                          }
                          onClick={() =>
                            openDeleteConfirmation(category)
                          }
                        >
                          Delete
                        </Button>
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

      {isCreating ? (
        <CreateCategoryDialog
          onClose={() => setIsCreating(false)}
          onSaved={(message) =>
            setFeedback({ severity: 'success', message })
          }
        />
      ) : null}

      {editingCategoryId ? (
        <EditCategoryDialog
          categoryId={editingCategoryId}
          onClose={() => setEditingCategoryId(null)}
          onSaved={(message) =>
            setFeedback({ severity: 'success', message })
          }
        />
      ) : null}

      <ConfirmationDialog
        open={Boolean(statusCategory)}
        title="Deactivate category"
        description={
          statusCategory
            ? `Deactivate ${statusCategory.name}? Existing article relationships will be preserved, but the category will no longer appear in public category lists.`
            : ''
        }
        confirmLabel="Deactivate"
        isPending={statusMutation.isPending}
        errorMessage={
          statusMutation.isError
            ? errorMessage(statusMutation.error)
            : null
        }
        onCancel={() => setStatusCategory(null)}
        onConfirm={confirmDeactivation}
      />

      <ConfirmationDialog
        open={Boolean(deleteCategory)}
        title="Delete category"
        description={
          deleteCategory
            ? `Permanently delete ${deleteCategory.name}? This only succeeds when no articles reference the category.`
            : ''
        }
        confirmLabel="Delete category"
        isPending={deleteMutation.isPending}
        errorMessage={deleteErrorMessage}
        onCancel={() => setDeleteCategory(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}
