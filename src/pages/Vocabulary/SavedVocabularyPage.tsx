import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { CollectionSidebar } from '@/components/Vocabulary/CollectionSidebar'
import { DueVocabularyHeader } from '@/components/Vocabulary/DueVocabularyHeader'
import { VocabularyFilterBar } from '@/components/Vocabulary/VocabularyFilterBar'
import { VocabularyItemCard } from '@/components/Vocabulary/VocabularyItemCard'
import { VocabularyItemTable } from '@/components/Vocabulary/VocabularyItemTable'
import {
  useDeleteVocabularyMutation,
  useDeleteVocabulariesMutation,
  useVocabulariesQuery,
} from '@/hooks/Vocabulary/useVocabularies'
import type { GetVocabulariesQueryParams } from '@/types/Vocabulary/vocabulary'
import {
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

  const currentParams = vocabularyParamsFromSearchParams(searchParams)

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useVocabulariesQuery(currentParams)

  const deleteMutation = useDeleteVocabularyMutation()
  const bulkDeleteMutation = useDeleteVocabulariesMutation()

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
    handleFilterChange({ collectionId })
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
    }
    setSearchParams(vocabularySearchParamsFromParams(defaultParams))
  }

  const handleToggleDueOnly = (dueOnly: boolean) => {
    handleFilterChange({ dueOnly: dueOnly ? true : undefined })
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

  const hasActiveFilters = Boolean(
    currentParams.q ||
      currentParams.learningStatus ||
      currentParams.cefrLevel ||
      currentParams.collectionId ||
      currentParams.dueOnly,
  )

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: 1 }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          pb: { xs: 3, md: 4 },
          mb: { xs: 3, md: 4 },
        }}
      >
        <Typography
          component="h1"
          variant="h1"
          sx={{
            fontSize: { xs: 40, sm: 50, md: 58 },
            textWrap: 'balance',
          }}
        >
          {t('page.title', 'Saved Vocabulary')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Collections Sidebar */}
        <Grid size={{ xs: 12, md: 3.5 }}>
          <CollectionSidebar
            selectedCollectionId={currentParams.collectionId}
            totalVocabularyCount={!hasActiveFilters ? total : undefined}
            onSelectCollection={handleSelectCollection}
          />
        </Grid>

        {/* Right Column: Vocabulary List & Management */}
        <Grid size={{ xs: 12, md: 8.5 }}>
          <DueVocabularyHeader
            dueOnly={currentParams.dueOnly}
            onToggleDueOnly={handleToggleDueOnly}
          />

          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <VocabularyFilterBar
              params={currentParams}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />

            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              {isError ? (
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: 2.5 }}
                  action={
                    <Button color="inherit" size="small" onClick={() => void refetch()}>
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
                  {hasActiveFilters ? (
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
                <Stack spacing={3}>
                  {isDesktop ? (
                    <VocabularyItemTable
                      items={items}
                      selectedIds={selectedIds}
                      onToggleSelected={handleToggleSelected}
                      onToggleAll={handleToggleAll}
                      onDelete={handleDelete}
                      onBulkDelete={handleBulkDelete}
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
    </Container>
  )
}
