import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  Link as RouterLink,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ArticleClassification } from '@/components/Article/ArticleChips'
import { ArticleRenderer } from '@/components/Article/ArticleRenderer'
import { normalizeApiError } from '@/config/apiClient'
import { useAdminArticlePreviewQuery } from '@/hooks/Admin/useAdminArticleContent'
import { CEFR_LEVELS, type CefrLevel } from '@/types/Auth/auth'
import {
  adminArticleContentPath,
  routePaths,
} from '@/utils/paths'

const previewLevelFromParams = (
  searchParams: URLSearchParams,
): CefrLevel | undefined => {
  const value = searchParams.get('cefrLevel')
  return CEFR_LEVELS.find((level) => level === value)
}

const apiMessage = (error: unknown) => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

export function AdminArticlePreviewPage() {
  const { articleId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCefrLevel = previewLevelFromParams(searchParams)
  const previewQuery = useAdminArticlePreviewQuery(
    articleId,
    selectedCefrLevel,
  )

  const heading = (
    <Stack spacing={1}>
      <Typography
        variant="h1"
        sx={{ fontSize: { xs: 34, md: 46 }, textWrap: 'balance' }}
      >
        Article preview
      </Typography>
      <Typography color="text.secondary">
        This view does not save vocabulary or update reading progress.
      </Typography>
    </Stack>
  )

  if (previewQuery.isPending) {
    return (
      <Stack spacing={3.5}>
        {heading}
        <Paper
          variant="outlined"
          sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">
              Loading preview…
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    )
  }

  if (previewQuery.isError) {
    return (
      <Stack spacing={3.5}>
        {heading}
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => previewQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {apiMessage(previewQuery.error)}
        </Alert>
        <Button
          component={RouterLink}
          to={adminArticleContentPath(articleId)}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to content workspace
        </Button>
      </Stack>
    )
  }

  const { article, contentHtml, terms, validationWarnings } =
    previewQuery.data
  const effectiveLevel = selectedCefrLevel ?? article.cefrLevel
  const highlightedIds = terms
    .filter((term) => term.isHighlighted)
    .map((term) => term.id)

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}
      >
        {heading}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            component={RouterLink}
            to={adminArticleContentPath(articleId)}
            variant="outlined"
          >
            Content workspace
          </Button>
          <Button
            component={RouterLink}
            to={routePaths.adminArticles}
            color="inherit"
          >
            Back to articles
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Stack spacing={1}>
            <ArticleClassification
              status={article.status}
              cefrLevel={article.cefrLevel}
            />
            <Typography color="text.secondary">
              Content version {article.contentVersion} · {terms.length} active
              lookup {terms.length === 1 ? 'term' : 'terms'}
            </Typography>
          </Stack>
          <TextField
            select
            label="Simulate reader CEFR"
            value={selectedCefrLevel ?? ''}
            onChange={(event) =>
              setSearchParams((current) => {
                const next = new URLSearchParams(current)
                if (event.target.value) {
                  next.set('cefrLevel', event.target.value)
                } else {
                  next.delete('cefrLevel')
                }
                return next
              })
            }
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Article default ({article.cefrLevel})</MenuItem>
            {CEFR_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {validationWarnings.length > 0 ? (
        <Alert severity="warning">
          <Typography sx={{ fontWeight: 750 }}>
            Publication validation found {validationWarnings.length}{' '}
            {validationWarnings.length === 1 ? 'issue' : 'issues'}.
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, mb: 0 }}>
            {validationWarnings.map((warning) => (
              <li key={`${warning.code}:${warning.entityId ?? ''}`}>
                {warning.message}
              </li>
            ))}
          </Box>
        </Alert>
      ) : (
        <Alert severity="success">
          The backend publication checklist returned no warnings.
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{ overflow: 'hidden', maxWidth: 940, width: '100%', mx: 'auto' }}
      >
        {article.thumbnailUrl ? (
          <Box
            component="img"
            src={article.thumbnailUrl}
            alt=""
            width={1600}
            height={900}
            loading="lazy"
            sx={{
              display: 'block',
              width: '100%',
              aspectRatio: '16 / 9',
              objectFit: 'cover',
              bgcolor: 'divider',
            }}
          />
        ) : null}
        <Box sx={{ p: { xs: 2.5, sm: 4.5, md: 6 } }}>
          <Stack spacing={2.5} sx={{ mb: 4 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip label={article.category.name} size="small" />
              <Chip
                label={`Highlighting ${effectiveLevel}+`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Stack>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: 36, sm: 50 }, textWrap: 'balance' }}
            >
              {article.title}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: 18, lineHeight: 1.6 }}
            >
              {article.summary}
            </Typography>
            {article.authorName || article.sourceName ? (
              <Typography color="text.secondary">
                {[article.authorName, article.sourceName]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            ) : null}
          </Stack>
          <ArticleRenderer
            contentHtml={contentHtml}
            highlightedTermIds={highlightedIds}
          />
        </Box>
      </Paper>
    </Stack>
  )
}
