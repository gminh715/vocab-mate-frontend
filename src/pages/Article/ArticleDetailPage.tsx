import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ArticleCefrChip } from '../../components/Article/ArticleChips'
import { ArticleCover } from '../../components/Article/ArticleCover'
import { normalizeApiError } from '../../config/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { useArticleDetailQuery } from '../../hooks/useArticles'
import { readerPath, routePaths } from '../../utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
})

const numberFormatter = new Intl.NumberFormat()

const errorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 400) {
    return 'This article address is not valid. Return to the article library and choose another article.'
  }

  return apiError.status === 0
    ? apiError.message
    : 'Article details could not be loaded. Try again.'
}

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

interface MetadataItemProps {
  label: string
  value: React.ReactNode
}

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <Box>
      <Typography
        component="dt"
        sx={{
          color: 'text.secondary',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  )
}

export function ArticleDetailPage() {
  const { slug = '' } = useParams()
  const { isAuthenticated, isInitializing } = useAuth()
  const articleQuery = useArticleDetailQuery(slug)

  if (articleQuery.isPending) {
    return (
      <Paper
        variant="outlined"
        sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}
      >
        <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={36} />
          <Typography color="text.secondary">
            Loading article details…
          </Typography>
        </Stack>
      </Paper>
    )
  }

  if (articleQuery.isError) {
    const apiError = normalizeApiError(articleQuery.error)

    if (apiError.status === 404) {
      return (
        <Paper
          variant="outlined"
          sx={{
            display: 'grid',
            minHeight: 360,
            placeItems: 'center',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 520 }}>
            <Typography component="h1" variant="h1" sx={{ fontSize: 40 }}>
              Article not found
            </Typography>
            <Typography color="text.secondary">
              This article may be unavailable or no longer published. Choose
              another article from the library.
            </Typography>
            <Button
              component={RouterLink}
              to={routePaths.articles}
              variant="outlined"
            >
              Back to articles
            </Button>
          </Stack>
        </Paper>
      )
    }

    return (
      <Stack spacing={2}>
        <Button
          component={RouterLink}
          to={routePaths.articles}
          color="inherit"
          sx={{ alignSelf: 'flex-start' }}
        >
          ← Back to articles
        </Button>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => articleQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {errorMessage(articleQuery.error)}
        </Alert>
      </Stack>
    )
  }

  const { article, category, quizCount } = articleQuery.data
  const destination = readerPath(article.slug)
  const publishedDate = article.publishedAt
    ? dateFormatter.format(new Date(article.publishedAt))
    : 'Date unavailable'
  const sourceUrl =
    article.sourceUrl && isHttpUrl(article.sourceUrl)
      ? article.sourceUrl
      : null

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Button
        component={RouterLink}
        to={routePaths.articles}
        color="inherit"
        sx={{ alignSelf: 'flex-start' }}
      >
        ← Back to articles
      </Button>

      <Paper
        component="article"
        variant="outlined"
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 1.12fr) minmax(340px, 0.88fr)',
          },
          overflow: 'hidden',
        }}
      >
        <Stack
          spacing={{ xs: 2.5, md: 3 }}
          sx={{
            order: { xs: 2, md: 1 },
            justifyContent: 'center',
            minWidth: 0,
            p: { xs: 3, sm: 4.5, md: 6 },
            borderLeft: { md: 6 },
            borderColor: { md: 'primary.main' },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
          >
            <Typography
              sx={{
                color: 'primary.main',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {category.name}
            </Typography>
            <ArticleCefrChip level={article.cefrLevel} />
          </Stack>

          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: 39, sm: 50, md: 58 },
              overflowWrap: 'anywhere',
              textWrap: 'balance',
            }}
          >
            {article.title}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              maxWidth: 700,
              fontSize: { xs: 17, sm: 19 },
              lineHeight: 1.7,
              textWrap: 'pretty',
            }}
          >
            {article.summary}
          </Typography>

          <Divider />

          <Box
            component="dl"
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2.5,
              m: 0,
            }}
          >
            <MetadataItem label="Published" value={publishedDate} />
            {article.authorName ? (
              <MetadataItem label="Author" value={article.authorName} />
            ) : null}
            <MetadataItem
              label="Practice"
              value={`${numberFormatter.format(quizCount)} ${
                quizCount === 1 ? 'quiz' : 'quizzes'
              }`}
            />
            {article.sourceName || sourceUrl ? (
              <MetadataItem
                label="Source"
                value={
                  sourceUrl ? (
                    <Link
                      href={sourceUrl}
                      aria-label={`Visit source: ${
                        article.sourceName ?? 'Original article'
                      }`}
                    >
                      {article.sourceName ?? 'Original article'}
                    </Link>
                  ) : (
                    article.sourceName
                  )
                }
              />
            ) : null}
          </Box>

          <Stack spacing={1.25} sx={{ alignItems: 'flex-start' }}>
            <Button
              component={RouterLink}
              to={isAuthenticated ? destination : routePaths.login}
              state={
                isAuthenticated ? undefined : { from: destination }
              }
              variant="contained"
              size="large"
              disabled={isInitializing}
            >
              {isInitializing ? 'Checking session…' : 'Start reading'}
            </Button>
            {!isInitializing && !isAuthenticated ? (
              <Typography color="text.secondary" variant="body2">
                Sign in is required to open the focused reader. You will return
                to this article after signing in.
              </Typography>
            ) : null}
          </Stack>
        </Stack>

        <Box sx={{ order: { xs: 1, md: 2 }, bgcolor: 'primary.light' }}>
          <ArticleCover
            categoryName={category.name}
            thumbnailUrl={article.thumbnailUrl}
            priority
          />
        </Box>
      </Paper>
    </Stack>
  )
}
