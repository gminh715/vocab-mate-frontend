import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link as RouterLink,
  useSearchParams,
} from 'react-router-dom'
import { ArticleCefrChip } from '@/components/Article/ArticleChips'
import { ArticleCover } from '@/components/Article/ArticleCover'
import { DebouncedSearchField } from '@/components/Shared/DebouncedSearchField'
import { normalizeApiError } from '@/config/apiClient'
import { useArticleListQuery } from '@/hooks/Article/useArticles'
import { useCategoryListQuery } from '@/hooks/Article/useCategories'
import type { ArticleListItem } from '@/types/Article/articles'
import { CEFR_LEVELS } from '@/types/Auth/auth'
import {
  articleListParamsFromSearchParams,
  articleSearchParamsFromListParams,
  normalizeArticleSearchParams,
} from '@/utils/Article/articleListParams'
import { readerPath } from '@/utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

const numberFormatter = new Intl.NumberFormat()

function ArticleCard({ article, t }: { article: ArticleListItem; t: ReturnType<typeof useTranslation<'articles'>>['t'] }) {
  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        height: '100%',
        overflow: 'hidden',
        transition: 'border-color 160ms ease, transform 160ms ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
        '&:focus-within': {
          borderColor: 'primary.main',
        },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={readerPath(article.slug)}
        aria-label={t('list.readAriaLabel', { title: article.title })}
        sx={{
          display: 'flex',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}
      >
        <ArticleCover
          categoryName={article.category.name}
          thumbnailUrl={article.thumbnailUrl}
        />

        <Stack spacing={1.5} sx={{ flexGrow: 1, p: 2.5, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <ArticleCefrChip level={article.cefrLevel} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {article.publishedAt
                ? dateFormatter.format(new Date(article.publishedAt))
                : t('list.dateUnavailable')}
            </Typography>
          </Stack>

          <Typography
            component="h2"
            sx={{
              color: 'text.primary',
              fontFamily: '"Merriweather", serif',
              fontSize: 23,
              fontWeight: 700,
              lineHeight: 1.24,
              textWrap: 'balance',
            }}
          >
            {article.title}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
            }}
          >
            {article.summary}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  )
}

export function ArticlesPage() {
  const { t } = useTranslation('articles')
  const [searchParams, setSearchParams] = useSearchParams()
  const searchString = searchParams.toString()
  const params = articleListParamsFromSearchParams(searchParams)
  const articlesQuery = useArticleListQuery(params)
  const categoriesQuery = useCategoryListQuery()

  useEffect(() => {
    const normalized = normalizeArticleSearchParams(searchParams)

    if (normalized.toString() !== searchString) {
      setSearchParams(normalized, { replace: true })
    }
  }, [searchParams, searchString, setSearchParams])

  const updateSearchParams = (
    updates: Partial<{
      page: number
      q: string
      categorySlug: string
      cefrLevel: string
      sort: string
    }>,
    resetPage = true,
  ) => {
    setSearchParams((current) => {
      const nextParams = articleListParamsFromSearchParams(current)

      if (resetPage) nextParams.page = 1
      if (updates.page !== undefined) nextParams.page = updates.page

      if (updates.q !== undefined) {
        nextParams.q = updates.q || undefined
      }
      if (updates.categorySlug !== undefined) {
        nextParams.categorySlug = updates.categorySlug || undefined
      }
      if (updates.cefrLevel !== undefined) {
        nextParams.cefrLevel = CEFR_LEVELS.find(
          (level) => level === updates.cefrLevel,
        )
      }
      if (updates.sort !== undefined) {
        nextParams.sort =
          updates.sort === 'oldest' ? 'oldest' : 'newest'
      }

      return articleSearchParamsFromListParams(nextParams)
    })
  }

  const clearFilters = () => setSearchParams(new URLSearchParams())
  const hasNarrowingFilters = Boolean(
    params.q || params.categorySlug || params.cefrLevel,
  )
  const hasChangedDefaults =
    hasNarrowingFilters || params.sort !== 'newest'
  const listData = articlesQuery.data

  const getErrorMessage = (error: unknown): string => {
    const apiError = normalizeApiError(error)
    if (apiError.status === 400) return t('list.errors.invalidFilters')
    return apiError.status === 0 ? apiError.message : t('list.errors.loadError')
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
            {t('list.heading')}
          </Typography>
        </Box>
        {listData ? (
          <Typography
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {numberFormatter.format(listData.meta.total)}{' '}
            {t('list.article', { count: listData.meta.total })}
          </Typography>
        ) : null}
      </Box>

      <Paper
        component="section"
        aria-label={t('list.filters.ariaLabel')}
        variant="outlined"
        sx={{ p: { xs: 1.5, sm: 1.75 } }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'minmax(280px, 1.5fr) repeat(3, minmax(150px, 1fr)) auto',
            },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <DebouncedSearchField
            size="small"
            key={params.q ?? ''}
            initialValue={params.q ?? ''}
            label={t('list.filters.search')}
            placeholder={t('list.filters.searchPlaceholder')}
            onCommit={(q) => updateSearchParams({ q })}
          />
          <TextField
            size="small"
            select
            label={t('list.filters.category')}
            name="category"
            value={params.categorySlug ?? ''}
            disabled={categoriesQuery.isPending}
            onChange={(event) =>
              updateSearchParams({ categorySlug: event.target.value })
            }
          >
            <MenuItem value="">{t('list.filters.allCategories')}</MenuItem>
            {categoriesQuery.data?.items.map((category) => (
              <MenuItem key={category.id} value={category.slug}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label={t('list.filters.cefrLevel')}
            name="cefr"
            value={params.cefrLevel ?? ''}
            onChange={(event) =>
              updateSearchParams({ cefrLevel: event.target.value })
            }
          >
            <MenuItem value="">{t('list.filters.allLevels')}</MenuItem>
            {CEFR_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label={t('list.filters.sort')}
            name="sort"
            value={params.sort}
            onChange={(event) =>
              updateSearchParams({ sort: event.target.value })
            }
          >
            <MenuItem value="newest">{t('list.filters.newest')}</MenuItem>
            <MenuItem value="oldest">{t('list.filters.oldest')}</MenuItem>
          </TextField>
          {hasChangedDefaults ? (
            <Button size="small" color="inherit" onClick={clearFilters}>
              {t('list.filters.clearFilters')}
            </Button>
          ) : null}
        </Box>

        {categoriesQuery.isError ? (
          <Alert
            severity="warning"
            sx={{ mt: 2 }}
            action={
              <Button
                color="inherit"
                onClick={() => categoriesQuery.refetch()}
              >
                {t('list.errors.retryCategories')}
              </Button>
            }
          >
            {t('list.errors.categoriesError')}
          </Alert>
        ) : null}
      </Paper>

      {articlesQuery.isFetching && !articlesQuery.isPending ? (
        <LinearProgress aria-label={t('list.loading')} />
      ) : null}

      {articlesQuery.isPending ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={34} />
            <Typography color="text.secondary">{t('list.loading')}</Typography>
          </Stack>
        </Paper>
      ) : articlesQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => articlesQuery.refetch()}>
              {t('list.errors.tryAgain')}
            </Button>
          }
        >
          {getErrorMessage(articlesQuery.error)}
        </Alert>
      ) : listData && listData.items.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            display: 'grid',
            minHeight: 280,
            placeItems: 'center',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 480 }}>
            <Typography variant="h2" sx={{ fontSize: 28 }}>
              {hasNarrowingFilters
                ? t('list.empty.withFilters')
                : t('list.empty.noArticles')}
            </Typography>
            <Typography color="text.secondary">
              {hasNarrowingFilters
                ? t('list.empty.withFiltersSubtitle')
                : t('list.empty.noArticlesSubtitle')}
            </Typography>
          </Stack>
        </Paper>
      ) : listData ? (
        <>
          <Box
            component="section"
            aria-label={t('list.pagination.resultsAriaLabel')}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {listData.items.map((article) => (
              <ArticleCard key={article.id} article={article} t={t} />
            ))}
          </Box>

          {listData.meta.totalPages > 1 ? (
            <Stack
              component="nav"
              aria-label={t('list.pagination.ariaLabel')}
              sx={{ alignItems: 'center' }}
            >
              <Pagination
                page={listData.meta.page}
                count={listData.meta.totalPages}
                color="primary"
                disabled={articlesQuery.isPlaceholderData}
                onChange={(_, page) =>
                  updateSearchParams({ page }, false)
                }
              />
            </Stack>
          ) : null}
        </>
      ) : null}
    </Stack>
  )
}
