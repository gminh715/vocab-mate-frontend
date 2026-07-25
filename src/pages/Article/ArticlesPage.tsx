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
import {
  Link as RouterLink,
  useSearchParams,
} from 'react-router-dom'
import { ArticleCefrChip } from '../../components/Article/ArticleChips'
import { ArticleCover } from '../../components/Article/ArticleCover'
import { DebouncedSearchField } from '../../components/Shared/DebouncedSearchField'
import { normalizeApiError } from '../../config/apiClient'
import { useArticleListQuery } from '../../hooks/useArticles'
import { useCategoryListQuery } from '../../hooks/useCategories'
import type { ArticleListItem } from '../../types/articles'
import { CEFR_LEVELS } from '../../types/auth'
import {
  articleListParamsFromSearchParams,
  articleSearchParamsFromListParams,
  normalizeArticleSearchParams,
} from '../../utils/articleListParams'
import { articlePath } from '../../utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

const numberFormatter = new Intl.NumberFormat()

const errorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 400) {
    return 'These filters are not valid. Clear them and try again.'
  }

  return apiError.status === 0
    ? apiError.message
    : 'Articles could not be loaded. Try again.'
}

function ArticleCard({ article }: { article: ArticleListItem }) {
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
        to={articlePath(article.slug)}
        aria-label={`Read ${article.title}`}
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
                : 'Date unavailable'}
            </Typography>
          </Stack>

          <Typography
            component="h2"
            sx={{
              color: 'text.primary',
              fontFamily: 'Georgia, serif',
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
        <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Reading library
          </Typography>
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: 40, sm: 50, md: 58 },
              textWrap: 'balance',
            }}
          >
            Find your next English read
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 660, fontSize: { sm: 18 }, textWrap: 'pretty' }}
          >
            Choose a topic and level, then build vocabulary through articles
            that fit where you are learning now.
          </Typography>
        </Stack>
        {listData ? (
          <Typography
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {numberFormatter.format(listData.meta.total)}{' '}
            {listData.meta.total === 1 ? 'article' : 'articles'}
          </Typography>
        ) : null}
      </Box>

      <Paper
        component="section"
        aria-label="Article filters"
        variant="outlined"
        sx={{ p: { xs: 2, sm: 2.5 } }}
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
            key={params.q ?? ''}
            initialValue={params.q ?? ''}
            label="Search articles"
            placeholder="Try “climate” or “technology”…"
            onCommit={(q) => updateSearchParams({ q })}
          />
          <TextField
            select
            label="Category"
            name="category"
            value={params.categorySlug ?? ''}
            disabled={categoriesQuery.isPending}
            onChange={(event) =>
              updateSearchParams({ categorySlug: event.target.value })
            }
          >
            <MenuItem value="">All categories</MenuItem>
            {categoriesQuery.data?.items.map((category) => (
              <MenuItem key={category.id} value={category.slug}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="CEFR level"
            name="cefr"
            value={params.cefrLevel ?? ''}
            onChange={(event) =>
              updateSearchParams({ cefrLevel: event.target.value })
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
            label="Sort"
            name="sort"
            value={params.sort}
            onChange={(event) =>
              updateSearchParams({ sort: event.target.value })
            }
          >
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
          </TextField>
          {hasChangedDefaults ? (
            <Button color="inherit" onClick={clearFilters}>
              Clear filters
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
                Retry categories
              </Button>
            }
          >
            Categories could not be loaded. You can still search all articles.
          </Alert>
        ) : null}
      </Paper>

      {articlesQuery.isFetching && !articlesQuery.isPending ? (
        <LinearProgress aria-label="Updating articles" />
      ) : null}

      {articlesQuery.isPending ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={34} />
            <Typography color="text.secondary">Loading articles…</Typography>
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
                ? 'No articles match these filters'
                : 'No published articles yet'}
            </Typography>
            <Typography color="text.secondary">
              {hasNarrowingFilters
                ? 'Try a broader search, another level, or a different category.'
                : 'New learning reads will appear here when they are published.'}
            </Typography>
          </Stack>
        </Paper>
      ) : listData ? (
        <>
          <Box
            component="section"
            aria-label="Article results"
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
              <ArticleCard key={article.id} article={article} />
            ))}
          </Box>

          {listData.meta.totalPages > 1 ? (
            <Stack
              component="nav"
              aria-label="Article pages"
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
