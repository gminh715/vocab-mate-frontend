import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { AddToCollectionDialog } from '@/components/Vocabulary/AddToCollectionDialog'
import { isApiError } from '@/config/apiClient'
import { useRemoveCollectionItemMutation } from '@/hooks/Vocabulary/useCollections'
import {
  useDeleteVocabularyMutation,
  useVocabularyDetailQuery,
} from '@/hooks/Vocabulary/useVocabularies'
import { readerPath, routePaths } from '@/utils/paths'

const cefrColorMap: Record<string, string> = {
  A1: '#4CAF50',
  A2: '#8BC34A',
  B1: '#FF9800',
  B2: '#ED6C02',
  C1: '#E91E63',
  C2: '#9C27B0',
}

interface DisplayExample {
  sentence: string
  translationVi: string | null
}

const parseExamples = (examples: unknown[]): DisplayExample[] =>
  examples.flatMap((example) => {
    if (
      typeof example !== 'object' ||
      example === null ||
      !('sentence' in example) ||
      typeof example.sentence !== 'string'
    ) {
      return []
    }

    const translationVi =
      'translationVi' in example && typeof example.translationVi === 'string'
        ? example.translationVi
        : null

    return [{ sentence: example.sentence, translationVi }]
  })

export function VocabularyDetailPage() {
  const { userVocabularyId = '' } = useParams<{ userVocabularyId: string }>()
  const navigate = useNavigate()

  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } =
    useVocabularyDetailQuery(userVocabularyId)

  const deleteMutation = useDeleteVocabularyMutation()
  const removeCollectionMutation = useRemoveCollectionItemMutation()

  const vocabulary = data?.vocabulary
  const collections = data?.collections ?? []
  const sourceArticle = data?.sourceArticle

  const handleRemoveFromCollection = (collectionId: string) => {
    if (!userVocabularyId) return
    removeCollectionMutation.mutate({
      collectionId,
      userVocabularyId,
    })
  }

  const handleDeleteVocabulary = () => {
    if (!userVocabularyId) return
    setDeleteError(null)

    deleteMutation.mutate(userVocabularyId, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        navigate(routePaths.vocabularies)
      },
      onError: () => {
        setDeleteDialogOpen(false)
        setDeleteError('Failed to delete vocabulary item. Try again.')
      },
    })
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg" disableGutters sx={{ py: 2 }}>
        <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 3 }} />
      </Container>
    )
  }

  const is404 = isApiError(error) && error.status === 404

  if (isError || !vocabulary) {
    return (
      <Container maxWidth="lg" disableGutters sx={{ py: 3 }}>
        <Button
          component={RouterLink}
          to={routePaths.vocabularies}
          sx={{ mb: 3 }}
        >
          ← Back to Vocabulary List
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {is404 ? (
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                Saved Vocabulary Not Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The requested saved vocabulary item does not exist or is not owned by your account.
              </Typography>
              <Button
                component={RouterLink}
                to={routePaths.vocabularies}
                variant="contained"
                color="primary"
              >
                Go to Vocabulary List
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <Alert severity="error">
                Failed to load vocabulary details. Check your connection and try again.
              </Alert>
              <Button variant="outlined" color="primary" onClick={() => void refetch()}>
                Retry
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    )
  }

  const parsedExamples = parseExamples(vocabulary.savedExamples)

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: 1 }}>
      <Button
        component={RouterLink}
        to={routePaths.vocabularies}
        sx={{ mb: 3, fontWeight: 700 }}
      >
        ← Back to Vocabulary List
      </Button>

      {deleteError ? (
        <Alert severity="error" onClose={() => setDeleteError(null)} sx={{ mb: 3 }}>
          {deleteError}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                      {vocabulary.savedWordDisplay}
                    </Typography>

                    {vocabulary.savedLemma !== vocabulary.savedWordDisplay ? (
                      <Typography variant="h6" color="text.secondary">
                        ({vocabulary.savedLemma})
                      </Typography>
                    ) : null}

                    {vocabulary.savedIpa ? (
                      <Typography variant="h6" color="text.secondary">
                        /{vocabulary.savedIpa}/
                      </Typography>
                    ) : null}
                  </Stack>

                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    {vocabulary.savedPartOfSpeech}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip
                    label={vocabulary.savedCefrLevel}
                    sx={{
                      fontWeight: 800,
                      fontSize: 13,
                      bgcolor: cefrColorMap[vocabulary.savedCefrLevel] ?? 'primary.main',
                      color: '#FFFFFF',
                    }}
                  />

                </Stack>
              </Stack>

              <Divider />

              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                  Contextual Meaning (Vietnamese)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                  {vocabulary.savedMeaningVi}
                </Typography>
              </Box>

              {vocabulary.definitionEn ? (
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                    English Definition
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {vocabulary.definitionEn}
                  </Typography>
                </Box>
              ) : null}

              {parsedExamples.length > 0 ? (
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                    Examples
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 0.5 }}>
                    {parsedExamples.map((example, idx) => (
                      <Box key={idx} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          • {example.sentence}
                        </Typography>
                        {example.translationVi ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1.5 }}>
                            {example.translationVi}
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </Paper>

        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 750 }}>
                    Collections
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    color="primary"
                    onClick={() => setIsAddCollectionOpen(true)}
                  >
                    + Add
                  </Button>
                </Stack>

                {collections.length > 0 ? (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
                    {collections.map((col) => (
                      <Chip
                        key={col.id}
                        label={col.name}
                        onDelete={() => handleRemoveFromCollection(col.id)}
                        disabled={removeCollectionMutation.isPending}
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    This word isn&apos;t in any collections yet.
                  </Typography>
                )}
              </Stack>
            </Paper>

            {sourceArticle ? (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                {sourceArticle.thumbnailUrl ? (
                  <CardMedia
                    component="img"
                    height="120"
                    image={sourceArticle.thumbnailUrl}
                    alt={sourceArticle.title}
                  />
                ) : null}
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                    Source Article
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 750, mb: 1 }}>
                    {sourceArticle.title}
                  </Typography>
                  {sourceArticle.sourceName ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Source: {sourceArticle.sourceName}
                    </Typography>
                  ) : null}

                  {sourceArticle.slug ? (
                    <Button
                      component={RouterLink}
                      to={readerPath(sourceArticle.slug)}
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="small"
                    >
                      Read Article in Reader
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'error.light',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle2" color="error" sx={{ fontWeight: 750, mb: 1 }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Remove this saved vocabulary item from your account.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
              >
                Delete Vocabulary
              </Button>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <AddToCollectionDialog
        open={isAddCollectionOpen}
        onClose={() => setIsAddCollectionOpen(false)}
        userVocabularyId={userVocabularyId}
        existingCollections={collections}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="detail-delete-dialog-title"
      >
        <DialogTitle id="detail-delete-dialog-title">
          Remove Saved Vocabulary?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove &quot;{vocabulary.savedWordDisplay}&quot; from your saved vocabulary list? This will also remove the item from all your collections.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteVocabulary}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Removing…' : 'Remove Vocabulary'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
