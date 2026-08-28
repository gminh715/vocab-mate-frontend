import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { CollectionSidebar } from '@/components/Vocabulary/CollectionSidebar'
import { AddVocabularyToCollectionDialog } from '@/components/Vocabulary/AddVocabularyToCollectionDialog'
import { VocabularyFilterBar } from '@/components/Vocabulary/VocabularyFilterBar'
import { VocabularyItemCard } from '@/components/Vocabulary/VocabularyItemCard'
import { VocabularyItemTable } from '@/components/Vocabulary/VocabularyItemTable'
import {
  useDeleteVocabularyMutation,
  useDeleteVocabulariesMutation,
} from '@/hooks/Vocabulary/useVocabularies'
import {
  useCollectionDetailQuery,
  useCollectionItemsQuery,
  useCollectionsQuery,
  useDeleteCollectionMutation,
} from '@/hooks/Vocabulary/useCollections'
import { RenameCollectionDialog } from '@/components/Vocabulary/RenameCollectionDialog'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import type {
  CollectionListItem,
  GetVocabulariesQueryParams,
} from '@/types/Vocabulary/vocabulary'
import {
  collectionItemsParamsFromVocabularyParams,
  vocabularyParamsFromSearchParams,
  vocabularySearchParamsFromParams,
} from '@/utils/Vocabulary/vocabularyParams'

export function SavedVocabularyPage() {
  const { t } = useTranslation('vocabulary')
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleteError, setBulkDeleteError] = useState(false)
  const [collectionToRename, setCollectionToRename] =
    useState<CollectionListItem | null>(null)
  const [collectionToDelete, setCollectionToDelete] =
    useState<CollectionListItem | null>(null)
  const [deleteCollectionError, setDeleteCollectionError] = useState<string | null>(null)
  const [isAddVocabularyOpen, setIsAddVocabularyOpen] = useState(false)

  const currentParams = vocabularyParamsFromSearchParams(searchParams)
  const collectionsQuery = useCollectionsQuery({ limit: 100 })
  const selectedCollectionId =
    currentParams.collectionId ?? collectionsQuery.data?.items[0]?.id ?? ''
  const collectionItemsParams =
    collectionItemsParamsFromVocabularyParams(currentParams)
  const collectionItemsQuery = useCollectionItemsQuery(
    selectedCollectionId,
    collectionItemsParams,
  )
  const collectionDetailQuery = useCollectionDetailQuery(selectedCollectionId)
  const selectedCollection: CollectionListItem | undefined = collectionDetailQuery.data
    ? {
        ...collectionDetailQuery.data.collection,
        vocabularyCount: collectionDetailQuery.data.vocabularyCount,
      }
    : collectionsQuery.data?.items.find(({ id }) => id === selectedCollectionId)
  const data = collectionItemsQuery.data
  const isLoading = collectionsQuery.isLoading || collectionItemsQuery.isLoading
  const isError = collectionsQuery.isError || collectionItemsQuery.isError

  const deleteMutation = useDeleteVocabularyMutation()
  const bulkDeleteMutation = useDeleteVocabulariesMutation()
  const deleteCollectionMutation = useDeleteCollectionMutation()

  const handleFilterChange = (updates: Partial<GetVocabulariesQueryParams>) => {
    setSelectedIds(new Set())
    const nextParams: GetVocabulariesQueryParams = {
      ...currentParams,
      ...updates,
      // Reset to page 1 whenever any filter parameter changes
      page: 1,
    }
    setSearchParams(vocabularySearchParamsFromParams(nextParams))
  }

  const handleSelectCollection = (collectionId?: string) => {
    handleFilterChange({
      collectionId,
      ...(collectionId ? { cefrLevel: undefined } : {}),
    })
  }

  const handlePageChange = (_event: unknown, newPage: number) => {
    setSelectedIds(new Set())
    const nextParams: GetVocabulariesQueryParams = {
      ...currentParams,
      page: newPage,
    }
    setSearchParams(vocabularySearchParamsFromParams(nextParams))
  }

  const handleClearFilters = () => {
    const defaultParams: GetVocabulariesQueryParams = {
      page: 1,
      limit: currentParams.limit,
      sort: 'newest',
      ...(selectedCollectionId ? { collectionId: selectedCollectionId } : {}),
    }
    setSearchParams(vocabularySearchParamsFromParams(defaultParams))
  }

  const closeDeleteCollectionDialog = () => {
    if (deleteCollectionMutation.isPending) return
    setCollectionToDelete(null)
    setDeleteCollectionError(null)
  }

  const confirmDeleteCollection = () => {
    if (!collectionToDelete) return

    setDeleteCollectionError(null)
    deleteCollectionMutation.mutate(collectionToDelete.id, {
      onSuccess: () => {
        const nextCollectionId = collectionsQuery.data?.items.find(
          ({ id }) => id !== collectionToDelete.id,
        )?.id
        setCollectionToDelete(null)
        handleSelectCollection(nextCollectionId)
      },
      onError: () => {
        setDeleteCollectionError(t('sidebar.deleteDialog.error'))
      },
    })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setSelectedIds((current) => {
          const next = new Set(current)
          next.delete(id)
          return next
        })
      },
    })
  }

  const items = data?.items ?? []
  const meta = data?.meta
  const total = meta?.total ?? 0
  const totalPages = meta?.totalPages ?? 1
  const isTableFullBleed = isDesktop && !isError && total > 0

  const handleToggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleAll = () => {
    setSelectedIds((current) => {
      const allSelected = items.every((item) => current.has(item.id))
      return allSelected ? new Set() : new Set(items.map((item) => item.id))
    })
  }

  const handleBulkDelete = (ids: string[]) => {
    setBulkDeleteError(false)
    bulkDeleteMutation.mutate(ids, {
      onSuccess: () => setSelectedIds(new Set()),
      onError: () => {
        setSelectedIds(new Set())
        setBulkDeleteError(true)
      },
    })
  }

  const hasActiveFilters = Boolean(currentParams.q)

  const handleRetry = () => {
    void collectionsQuery.refetch()
    if (selectedCollectionId) void collectionItemsQuery.refetch()
  }

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          gap: 2,
          alignItems: 'end',
          borderBottom: 1,
          borderColor: 'divider',
          pb: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 720 }}>
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: 40, sm: 52 },
              textWrap: 'balance',
            }}
          >
            {t('page.title', 'Saved Vocabulary')}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Collections Sidebar */}
        <Grid size={{ xs: 12, md: 3.5 }}>
          <CollectionSidebar
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={handleSelectCollection}
          />
        </Grid>

        {/* Right Column: Vocabulary List & Management */}
        <Grid size={{ xs: 12, md: 8.5 }}>
          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              borderRadius: 1.5,
              bgcolor: 'background.paper',
            }}
          >
          {selectedCollection ? (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{
                alignItems: { md: 'center' },
                justifyContent: 'space-between',
                p: { xs: 1.5, sm: 2 },
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Box sx={{ minWidth: 0, mr: 0.5 }}>
                  <Typography
                    variant="h5"
                    noWrap
                    sx={{ fontWeight: 850, letterSpacing: '-0.02em' }}
                  >
                    {selectedCollection.name}
                  </Typography>
                </Box>
                <Tooltip title={t('sidebar.renameTooltip', { name: selectedCollection.name })}>
                  <IconButton
                    size="small"
                    aria-label={t('sidebar.renameTooltip', { name: selectedCollection.name })}
                    onClick={() => setCollectionToRename(selectedCollection)}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                  >
                    &#9998;
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sidebar.deleteTooltip', { name: selectedCollection.name })}>
                  <IconButton
                    size="small"
                    aria-label={t('sidebar.deleteTooltip', { name: selectedCollection.name })}
                    onClick={() => {
                      setDeleteCollectionError(null)
                      setCollectionToDelete(selectedCollection)
                    }}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                  >
                    &#128465;
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setIsAddVocabularyOpen(true)}
                  startIcon={
                    <Box component="span" aria-hidden="true" sx={{ fontSize: 22, lineHeight: 0.75 }}>
                      +
                    </Box>
                  }
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {t('collectionActions.addVocabulary')}
                </Button>
              </Stack>
            </Stack>
          ) : null}

          <VocabularyFilterBar
            params={currentParams}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            selectedCount={selectedIds.size}
            isBulkDeleting={bulkDeleteMutation.isPending}
            onBulkDelete={() => handleBulkDelete([...selectedIds])}
          />

            <Box sx={{ p: isTableFullBleed ? 0 : { xs: 2, sm: 2.5 } }}>
              {isError ? (
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: 2.5 }}
                  action={
                    <Button color="inherit" size="small" onClick={handleRetry}>
                      {t('page.error.retry')}
                    </Button>
                  }
                >
                  {t('page.error.load')}
                </Alert>
              ) : null}

              {bulkDeleteError ? (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                  {t('table.bulk.error')}
                </Alert>
              ) : null}

              {isLoading ? (
                <Stack spacing={2}>
                  {[1, 2, 3, 4].map((key) => (
                    <Skeleton
                      key={key}
                      variant="rectangular"
                      height={100}
                      sx={{ borderRadius: 3 }}
                    />
                  ))}
                </Stack>
              ) : !isError && total === 0 ? (
                <Box
                  sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                  }}
                >
                  {!selectedCollectionId ? (
                    <Stack spacing={2} sx={{ alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t('page.empty.noCollectionsTitle')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
                        {t('page.empty.noCollectionsSubtitle')}
                      </Typography>
                    </Stack>
                  ) : hasActiveFilters ? (
                    <Stack spacing={2} sx={{ alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t('page.empty.withFiltersTitle')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450 }}>
                        {t('page.empty.withFiltersSubtitle')}
                      </Typography>
                      <Button variant="outlined" color="primary" onClick={handleClearFilters}>
                        {t('page.empty.clearAllFilters')}
                      </Button>
                    </Stack>
                  ) : (
                    <Stack spacing={2} sx={{ alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t('page.empty.noVocabTitle')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
                        {t('page.empty.noVocabSubtitle')}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              ) : !isError ? (
                <Stack spacing={isTableFullBleed ? 0 : 3}>
                  {isDesktop ? (
                    <VocabularyItemTable
                      items={items}
                      selectedIds={selectedIds}
                      onToggleSelected={handleToggleSelected}
                      onToggleAll={handleToggleAll}
                      onDelete={handleDelete}
                      deletingId={
                        deleteMutation.isPending ? deleteMutation.variables : null
                      }
                      isBulkDeleting={bulkDeleteMutation.isPending}
                    />
                  ) : (
                    <Grid container spacing={2}>
                      {items.map((item) => (
                        <Grid key={item.id} size={{ xs: 12 }}>
                          <VocabularyItemCard
                            item={item}
                            onDelete={handleDelete}
                            isDeleting={
                              deleteMutation.isPending &&
                              deleteMutation.variables === item.id
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {totalPages > 1 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                      <Pagination
                        count={totalPages}
                        page={currentParams.page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        size={isDesktop ? 'medium' : 'small'}
                      />
                    </Box>
                  ) : null}
                </Stack>
              ) : null}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {collectionToRename ? (
        <RenameCollectionDialog
          key={collectionToRename.id}
          collection={collectionToRename}
          onClose={() => setCollectionToRename(null)}
        />
      ) : null}
      <ConfirmationDialog
        open={Boolean(collectionToDelete)}
        title={t('sidebar.deleteDialog.title')}
        description={t('sidebar.deleteDialog.description', {
          name: collectionToDelete?.name ?? '',
        })}
        cancelLabel={t('sidebar.deleteDialog.cancel')}
        confirmLabel={t('sidebar.deleteDialog.confirm')}
        pendingLabel={t('sidebar.deleteDialog.deleting')}
        isPending={deleteCollectionMutation.isPending}
        errorMessage={deleteCollectionError}
        onCancel={closeDeleteCollectionDialog}
        onConfirm={confirmDeleteCollection}
      />
      {isAddVocabularyOpen ? (
        <AddVocabularyToCollectionDialog
          open
          onClose={() => setIsAddVocabularyOpen(false)}
          defaultCollectionId={selectedCollectionId || undefined}
        />
      ) : null}
    </Stack>
  )
}
