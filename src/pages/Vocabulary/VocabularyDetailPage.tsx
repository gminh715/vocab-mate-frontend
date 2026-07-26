import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
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
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { AddToCollectionDialog } from '@/components/Vocabulary/AddToCollectionDialog'
import { isApiError } from '@/config/apiClient'
import { useRemoveCollectionItemMutation } from '@/hooks/Vocabulary/useCollections'
import {
  useDeleteVocabularyMutation,
  useUpdateVocabularyNoteMutation,
  useUpdateVocabularyStatusMutation,
  useVocabularyDetailQuery,
} from '@/hooks/Vocabulary/useVocabularies'
import {
  toUpdatePersonalNoteRequest,
  updatePersonalNoteFormSchema,
  type UpdatePersonalNoteFormValues,
} from '@/schemas/Vocabulary/vocabulary'
import { LEARNING_STATUSES, type LearningStatus } from '@/types/Vocabulary/vocabulary'
import { readerPath, routePaths } from '@/utils/paths'

const statusColorMap: Record<
  LearningStatus,
  'info' | 'warning' | 'secondary' | 'success' | 'default'
> = {
  NEW: 'info',
  LEARNING: 'warning',
  REVIEWING: 'secondary',
  MASTERED: 'success',
  IGNORED: 'default',
}

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

  const [isEditingNote, setIsEditingNote] = useState(false)
  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } =
    useVocabularyDetailQuery(userVocabularyId)

  const updateStatusMutation = useUpdateVocabularyStatusMutation()
  const updateNoteMutation = useUpdateVocabularyNoteMutation()
  const deleteMutation = useDeleteVocabularyMutation()
  const removeCollectionMutation = useRemoveCollectionItemMutation()

  const vocabulary = data?.vocabulary
  const collections = data?.collections ?? []
  const sourceArticle = data?.sourceArticle

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePersonalNoteFormValues>({
    resolver: zodResolver(updatePersonalNoteFormSchema),
    values: {
      personalNote: vocabulary?.personalNote ?? '',
    },
  })

  const handleUpdateStatus = (newStatus: LearningStatus) => {
    if (!userVocabularyId) return
    updateStatusMutation.mutate({
      userVocabularyId,
      learningStatus: newStatus,
    })
  }

  const handleNoteSubmit = (values: UpdatePersonalNoteFormValues) => {
    if (!userVocabularyId) return
    setNoteError(null)
    const payloadNote = toUpdatePersonalNoteRequest(values)

    updateNoteMutation.mutate(
      {
        userVocabularyId,
        personalNote: payloadNote,
      },
      {
        onSuccess: () => {
          setIsEditingNote(false)
        },
        onError: () => {
          setNoteError('Failed to save personal note. Please try again.')
        },
      },
    )
  }

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
      onError: (err) => {
        setDeleteDialogOpen(false)
        if (isApiError(err) && err.status === 409) {
          setDeleteError(
            'This vocabulary item is referenced in your review history and cannot be deleted.',
          )
        } else {
          setDeleteError('Failed to delete vocabulary item. Try again.')
        }
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

  const isDue =
    vocabulary.learningStatus !== 'MASTERED' &&
    vocabulary.learningStatus !== 'IGNORED' &&
    (!vocabulary.nextReviewAt || new Date(vocabulary.nextReviewAt) <= new Date())

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

                  {isDue ? (
                    <Chip
                      label="Due for review"
                      color="secondary"
                      sx={{ fontWeight: 800 }}
                    />
                  ) : null}
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

              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                  Context Sentence
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mt: 0.5,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    &quot;{vocabulary.savedContextSentence}&quot;
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {vocabulary.savedContextTranslationVi}
                  </Typography>
                </Paper>
              </Box>

              {vocabulary.savedExplanation ? (
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                    Contextual Explanation
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {vocabulary.savedExplanation}
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

          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 750 }}>
                  Personal Note
                </Typography>
                {!isEditingNote ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      reset({ personalNote: vocabulary.personalNote ?? '' })
                      setIsEditingNote(true)
                    }}
                  >
                    {vocabulary.personalNote ? 'Edit Note' : 'Add Note'}
                  </Button>
                ) : null}
              </Stack>

              {noteError ? <Alert severity="error">{noteError}</Alert> : null}

              {isEditingNote ? (
                <Box component="form" onSubmit={handleSubmit(handleNoteSubmit)}>
                  <TextField
                    {...register('personalNote')}
                    multiline
                    rows={3}
                    placeholder="Add your personal notes, mnemonics, or memory hooks…"
                    error={Boolean(errors.personalNote)}
                    helperText={errors.personalNote?.message}
                    disabled={isSubmitting || updateNoteMutation.isPending}
                    sx={{ mb: 2 }}
                  />

                  <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      onClick={() => setIsEditingNote(false)}
                      disabled={isSubmitting || updateNoteMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || updateNoteMutation.isPending}
                    >
                      {updateNoteMutation.isPending ? 'Saving…' : 'Save Note'}
                    </Button>
                  </Stack>
                </Box>
              ) : vocabulary.personalNote ? (
                <Typography variant="body1" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                  {vocabulary.personalNote}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No personal note added yet. Click &quot;Add Note&quot; to write memory hooks or personal notes.
                </Typography>
              )}
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
                <Typography variant="h6" sx={{ fontWeight: 750 }}>
                  Learning Status
                </Typography>

                <FormControl size="small" fullWidth>
                  <Select
                    id="detail-learning-status-select"
                    value={vocabulary.learningStatus}
                    disabled={updateStatusMutation.isPending}
                    onChange={(e) =>
                      handleUpdateStatus(e.target.value as LearningStatus)
                    }
                    sx={{ fontWeight: 700 }}
                  >
                    {LEARNING_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Chip
                          label={status}
                          size="small"
                          color={statusColorMap[status]}
                          sx={{ fontWeight: 700, fontSize: 11, mr: 1.5 }}
                        />
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {vocabulary.nextReviewAt ? (
                  <Typography variant="caption" color="text.secondary">
                    Next review: {new Date(vocabulary.nextReviewAt).toLocaleDateString()}
                  </Typography>
                ) : null}
              </Stack>
            </Paper>

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
