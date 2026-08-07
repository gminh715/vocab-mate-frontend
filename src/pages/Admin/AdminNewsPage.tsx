import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Link as RouterLink,
  useSearchParams,
} from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { useAdminCategoryOptionsQuery } from '@/hooks/Admin/useAdminCategories'
import {
  useAdminNewsSearchQuery,
  useAdminNewsSyncMutation,
} from '@/hooks/Admin/useAdminNews'
import {
  adminNewsSearchSchema,
  type AdminNewsSearchFormOutput,
  type AdminNewsSearchFormValues,
} from '@/schemas/Admin/adminNews'
import type {
  AdminNewsSearchParams,
  GuardianOrder,
  NewsSyncItemStatus,
} from '@/types/Admin/adminNews'
import { adminArticleContentPath } from '@/utils/paths'

const positiveInteger = (
  value: string | null,
  fallback: number,
  maximum: number,
) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : fallback
}

const orderByValue = (value: string | null): GuardianOrder =>
  value === 'oldest' || value === 'relevance' ? value : 'newest'

const searchParamsFromUrl = (
  searchParams: URLSearchParams,
): AdminNewsSearchParams => ({
  ...(searchParams.get('q')?.trim()
    ? { q: searchParams.get('q')?.trim() }
    : {}),
  ...(searchParams.get('section')?.trim()
    ? { section: searchParams.get('section')?.trim() }
    : {}),
  ...(searchParams.get('fromDate')
    ? { fromDate: searchParams.get('fromDate') ?? undefined }
    : {}),
  ...(searchParams.get('toDate')
    ? { toDate: searchParams.get('toDate') ?? undefined }
    : {}),
  orderBy: orderByValue(searchParams.get('orderBy')),
  page: positiveInteger(searchParams.get('page'), 1, 100),
  pageSize: positiveInteger(searchParams.get('pageSize'), 5, 10),
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatDate = (value: string) =>
  dateFormatter.format(new Date(value))

const safeErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 401 || apiError.status === 403) {
    return 'Guardian access was rejected. Check the server API key and Developer access.'
  }
  if (apiError.status === 429) {
    return 'Guardian quota or rate limit was reached. Wait before trying again.'
  }
  if (apiError.status === 504 || apiError.code === 'NETWORK_ERROR') {
    return 'Guardian did not respond in time. Try again shortly.'
  }

  return apiError.details?.[0] ?? apiError.message
}

const syncStatusColor = (
  status: NewsSyncItemStatus,
): 'success' | 'default' | 'error' =>
  status === 'imported'
    ? 'success'
    : status === 'failed'
      ? 'error'
      : 'default'

export function AdminNewsPage() {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const params = searchParamsFromUrl(urlSearchParams)
  const searchQuery = useAdminNewsSearchQuery(params)
  const syncMutation = useAdminNewsSyncMutation()
  const categoriesQuery = useAdminCategoryOptionsQuery(true)
  const [categoryId, setCategoryId] = useState('')
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    AdminNewsSearchFormValues,
    unknown,
    AdminNewsSearchFormOutput
  >({
    resolver: zodResolver(adminNewsSearchSchema),
    defaultValues: {
      q: params.q ?? '',
      section: params.section ?? '',
      fromDate: params.fromDate ?? '',
      toDate: params.toDate ?? '',
      orderBy: params.orderBy,
    },
  })

  const submitSearch = (values: AdminNewsSearchFormOutput) => {
    syncMutation.reset()
    setSelectedArticleIds([])
    const next = new URLSearchParams()
    if (values.q) next.set('q', values.q)
    if (values.section) next.set('section', values.section)
    if (values.fromDate) next.set('fromDate', values.fromDate)
    if (values.toDate) next.set('toDate', values.toDate)
    if (values.orderBy !== 'newest') next.set('orderBy', values.orderBy)
    next.set('page', '1')
    next.set('pageSize', String(params.pageSize))
    setUrlSearchParams(next)
  }

  const updatePage = (page: number, pageSize = params.pageSize) => {
    setUrlSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(page))
      next.set('pageSize', String(pageSize))
      return next
    })
  }

  const toggleSelectArticle = (externalId: string) => {
    setSelectedArticleIds((current) =>
      current.includes(externalId)
        ? current.filter((id) => id !== externalId)
        : [...current, externalId],
    )
  }

  const articlesOnPage = searchQuery.data?.articles ?? []
  const allPageIds = articlesOnPage.map((a) => a.externalId)
  const isAllPageSelected =
    allPageIds.length > 0 &&
    allPageIds.every((id) => selectedArticleIds.includes(id))

  const toggleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedArticleIds((current) =>
        current.filter((id) => !allPageIds.includes(id)),
      )
    } else {
      setSelectedArticleIds((current) =>
        Array.from(new Set([...current, ...allPageIds])),
      )
    }
  }

  const runSync = (idsToSync?: string[]) => {
    const articleIds =
      idsToSync && idsToSync.length > 0
        ? idsToSync
        : selectedArticleIds.length > 0
          ? selectedArticleIds
          : undefined

    syncMutation.mutate(
      {
        ...(params.q ? { q: params.q } : {}),
        ...(params.section ? { section: params.section } : {}),
        ...(params.fromDate ? { fromDate: params.fromDate } : {}),
        ...(params.toDate ? { toDate: params.toDate } : {}),
        orderBy: params.orderBy,
        pageSize: articleIds?.length
          ? articleIds.length
          : Math.min(params.pageSize, 5),
        ...(categoryId ? { defaultCategoryId: categoryId } : {}),
        ...(articleIds?.length ? { articleIds } : {}),
      },
      {
        onSuccess: () => {
          if (idsToSync) {
            setSelectedArticleIds((current) =>
              current.filter((id) => !idsToSync.includes(id)),
            )
          } else {
            setSelectedArticleIds([])
          }
        },
      },
    )
  }

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}
      >
        <Box>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Guardian intake
          </Typography>
          <Typography
            component="h1"
            variant="h1"
            sx={{ mt: 0.75, fontSize: { xs: 34, md: 46 } }}
          >
            Find source articles
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
            Browse Guardian news articles, select specific stories across pages, and import them directly into draft articles. Categories are automatically matched from Guardian sections.
          </Typography>
        </Box>
        <Chip
          label="Guardian intake"
          color="primary"
          variant="outlined"
          sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
        />
      </Stack>

      <Paper
        component="form"
        variant="outlined"
        onSubmit={handleSubmit(submitSearch)}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderLeft: 4,
          borderLeftColor: 'primary.main',
        }}
      >
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(220px, 1.5fr) repeat(2, minmax(155px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            <TextField
              label="Search phrase (optional)"
              placeholder="climate technology"
              error={Boolean(errors.q)}
              helperText={errors.q?.message}
              {...register('q')}
            />
            <TextField
              label="Guardian section (optional)"
              placeholder="technology"
              error={Boolean(errors.section)}
              helperText={errors.section?.message}
              {...register('section')}
            />
            <Controller
              name="orderBy"
              control={control}
              render={({ field }) => (
                <TextField select label="Order" {...field}>
                  <MenuItem value="newest">Newest first</MenuItem>
                  <MenuItem value="oldest">Oldest first</MenuItem>
                  <MenuItem value="relevance">Most relevant</MenuItem>
                </TextField>
              )}
            />
            <TextField
              type="date"
              label="From date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.fromDate)}
              helperText={errors.fromDate?.message}
              {...register('fromDate')}
            />
            <TextField
              type="date"
              label="To date"
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.toDate)}
              helperText={errors.toDate?.message}
              {...register('toDate')}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={searchQuery.isFetching}
              sx={{ minHeight: 56 }}
            >
              {searchQuery.isFetching ? 'Searching…' : 'Filter Guardian'}
            </Button>
          </Box>
          <Typography color="text.secondary" variant="body2">
            Articles are fetched live from The Guardian. Select articles to import — category is automatically matched to each story's section.
          </Typography>
        </Stack>
      </Paper>

      {searchQuery.isPending ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">
              Loading Guardian articles…
            </Typography>
          </Stack>
        </Paper>
      ) : searchQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => searchQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {safeErrorMessage(searchQuery.error)}
        </Alert>
      ) : (
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  {searchQuery.data.totalArticles.toLocaleString()} Guardian articles
                </Typography>
                {articlesOnPage.length > 0 ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isAllPageSelected}
                          indeterminate={
                            selectedArticleIds.some((id) => allPageIds.includes(id)) &&
                            !isAllPageSelected
                          }
                          onChange={toggleSelectAll}
                        />
                      }
                      label={
                        selectedArticleIds.length > 0
                          ? `Selected ${selectedArticleIds.length} article(s)`
                          : 'Select all on page'
                      }
                      sx={{ m: 0 }}
                    />
                    {selectedArticleIds.length > 0 ? (
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => setSelectedArticleIds([])}
                      >
                        Clear selection
                      </Button>
                    ) : null}
                  </Stack>
                ) : null}
              </Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{ minWidth: { md: 460 } }}
              >
                <TextField
                  select
                  fullWidth
                  label="Category (optional override)"
                  value={categoryId}
                  disabled={categoriesQuery.isPending}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <MenuItem value="">Auto-detect from Guardian section</MenuItem>
                  {categoriesQuery.data?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  disabled={syncMutation.isPending}
                  onClick={() => runSync()}
                  sx={{ minWidth: 160 }}
                >
                  {syncMutation.isPending
                    ? 'Importing…'
                    : selectedArticleIds.length > 0
                      ? `Import selected (${selectedArticleIds.length})`
                      : 'Import drafts'}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {syncMutation.isError ? (
            <Alert severity="error">
              {safeErrorMessage(syncMutation.error)}
            </Alert>
          ) : null}

          {syncMutation.data ? (
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: 'primary.light' }}>
                <Typography variant="h2" sx={{ fontSize: 25 }}>
                  Import report
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}
                >
                  <Chip label={`${syncMutation.data.counts.imported} imported`} color="success" />
                  <Chip label={`${syncMutation.data.counts.skippedDuplicate} duplicates`} />
                  <Chip
                    label={`${syncMutation.data.counts.failed} failed`}
                    color={syncMutation.data.counts.failed ? 'error' : 'default'}
                  />
                </Stack>
              </Box>
              <Stack divider={<Divider flexItem />}>
                {syncMutation.data.items.map((item) => (
                  <Stack
                    key={`${item.externalId}-${item.status}`}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ p: 2.5, justifyContent: 'space-between' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                      >
                        <Chip
                          size="small"
                          label={item.status}
                          color={syncStatusColor(item.status)}
                        />
                        <Typography sx={{ fontWeight: 750 }}>
                          {item.title}
                        </Typography>
                      </Stack>
                      {item.errorMessage ? (
                        <Typography color="error" variant="body2" sx={{ mt: 0.75 }}>
                          {item.errorMessage}
                        </Typography>
                      ) : null}
                    </Box>
                    {item.articleId ? (
                      <Button
                        component={RouterLink}
                        to={adminArticleContentPath(item.articleId)}
                        size="small"
                      >
                        Open draft
                      </Button>
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ) : null}

          {searchQuery.data.articles.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4 }}>
              <Typography variant="h2" sx={{ fontSize: 25 }}>
                No Guardian results
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Try a broader phrase, section, or date range.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {searchQuery.data.articles.map((article, index) => {
                const isSelected = selectedArticleIds.includes(article.externalId)

                return (
                  <Paper
                    key={article.externalId}
                    component="article"
                    variant="outlined"
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '4px minmax(0, 1fr)',
                        sm: '4px 152px minmax(0, 1fr)',
                      },
                      overflow: 'hidden',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderWidth: isSelected ? 2 : 1,
                    }}
                  >
                    <Box
                      aria-hidden="true"
                      sx={{ bgcolor: index === 0 ? 'secondary.main' : 'primary.main' }}
                    />
                    {article.imageUrl ? (
                      <Box
                        component="img"
                        src={article.imageUrl}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        sx={{
                          display: { xs: 'none', sm: 'block' },
                          width: '100%',
                          height: '100%',
                          minHeight: 170,
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box
                        aria-hidden="true"
                        sx={{
                          display: { xs: 'none', sm: 'grid' },
                          minHeight: 170,
                          placeItems: 'center',
                          bgcolor: 'primary.light',
                          color: 'primary.dark',
                          fontFamily: '"Merriweather", serif',
                          fontSize: 36,
                        }}
                      >
                        G
                      </Box>
                    )}
                    <Stack spacing={1.25} sx={{ p: { xs: 2.5, md: 3 } }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            label={article.sectionName ?? 'Guardian'}
                            variant="outlined"
                          />
                          <Typography color="text.secondary" variant="caption">
                            {formatDate(article.publishedAt)}
                          </Typography>
                        </Stack>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleSelectArticle(article.externalId)}
                              slotProps={{
                                input: {
                                  'aria-label': `Select ${article.title}`,
                                },
                              }}
                            />
                          }
                          label="Select"
                          sx={{ m: 0 }}
                        />
                      </Stack>
                      <Typography component="h2" variant="h2" sx={{ fontSize: 24 }}>
                        {article.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {article.description}
                      </Typography>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
                      >
                        <Typography variant="body2">
                          {article.authorName ?? article.sourceName}
                        </Typography>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Link
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontWeight: 750 }}
                          >
                            View on The Guardian
                          </Link>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={syncMutation.isPending}
                            onClick={() => runSync([article.externalId])}
                          >
                            Import
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                )
              })}
              <TablePagination
                component="div"
                count={searchQuery.data.totalArticles}
                page={Math.max(0, params.page - 1)}
                rowsPerPage={params.pageSize}
                rowsPerPageOptions={[5, 10]}
                onPageChange={(_, page) => updatePage(page + 1)}
                onRowsPerPageChange={(event) =>
                  updatePage(1, Number(event.target.value))
                }
              />
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  )
}
