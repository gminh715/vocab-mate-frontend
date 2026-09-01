import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { AddToCollectionDialog } from '@/components/Vocabulary/AddToCollectionDialog'
import { useRemoveCollectionItemMutation } from '@/hooks/Vocabulary/useCollections'
import {
  useDeleteVocabularyMutation,
  useVocabularyDetailQuery,
} from '@/hooks/Vocabulary/useVocabularies'
import { readerPath } from '@/utils/paths'

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

interface VocabularyDetailDialogProps {
  userVocabularyId: string | null
  open: boolean
  onClose: () => void
  onDeleted?: (userVocabularyId: string) => void
}

export function VocabularyDetailDialog({
  userVocabularyId,
  open,
  onClose,
  onDeleted,
}: VocabularyDetailDialogProps) {
  const { t } = useTranslation('vocabulary')

  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useVocabularyDetailQuery(
    userVocabularyId ?? '',
  )

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
        onClose()
        onDeleted?.(userVocabularyId)
      },
      onError: () => {
        setDeleteDialogOpen(false)
        setDeleteError('Không thể xóa từ vựng này. Vui lòng thử lại.')
      },
    })
  }

  const parsedExamples = vocabulary
    ? parseExamples(vocabulary.savedExamples)
    : []

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        aria-labelledby="vocabulary-detail-dialog-title"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          id="vocabulary-detail-dialog-title"
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 800, color: 'text.primary', overflowWrap: 'anywhere' }}
            >
              {vocabulary ? vocabulary.savedWordDisplay : t('detail.title', 'Chi tiết từ vựng')}
            </Typography>
            {vocabulary?.savedCefrLevel && (
              <Chip
                label={vocabulary.savedCefrLevel}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: 11,
                  bgcolor: cefrColorMap[vocabulary.savedCefrLevel] ?? 'primary.main',
                  color: '#FFFFFF',
                }}
              />
            )}
          </Stack>

          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Đóng"
            sx={{ color: 'text.secondary', ml: 1 }}
          >
            ✕
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {isLoading ? (
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Stack>
          ) : isError || !vocabulary ? (
            <Stack spacing={2} sx={{ py: 4, alignItems: 'center', textAlign: 'center' }}>
              <Alert severity="error" sx={{ width: '100%' }}>
                Không thể tải thông tin chi tiết từ vựng. Vui lòng thử lại.
              </Alert>
              <Button variant="outlined" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              {deleteError ? (
                <Alert severity="error" onClose={() => setDeleteError(null)}>
                  {deleteError}
                </Alert>
              ) : null}

              <Grid container spacing={3}>
                {/* Left Column: Word details, meaning & examples */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Stack spacing={2.5}>
                      <Box>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <Typography variant="h4" component="h3" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                            {vocabulary.savedWordDisplay}
                          </Typography>

                          {vocabulary.savedLemma !== vocabulary.savedWordDisplay ? (
                            <Typography variant="body1" color="text.secondary">
                              ({vocabulary.savedLemma})
                            </Typography>
                          ) : null}

                          {vocabulary.savedIpa ? (
                            <Typography variant="body1" color="text.secondary">
                              /{vocabulary.savedIpa}/
                            </Typography>
                          ) : null}
                        </Stack>

                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                          {vocabulary.savedPartOfSpeech}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                          Nghĩa ngữ cảnh (Tiếng Việt)
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                          {vocabulary.savedMeaningVi}
                        </Typography>
                      </Box>

                      {vocabulary.definitionEn ? (
                        <Box>
                          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                            Định nghĩa (Tiếng Anh)
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                            {vocabulary.definitionEn}
                          </Typography>
                        </Box>
                      ) : null}

                      {parsedExamples.length > 0 ? (
                        <Box>
                          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                            Câu ví dụ trong ngữ cảnh
                          </Typography>
                          <Stack spacing={1.25} sx={{ mt: 0.75 }}>
                            {parsedExamples.map((example, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  bgcolor: 'background.default',
                                  borderLeft: 3,
                                  borderLeftColor: 'primary.main',
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  • {example.sentence}
                                </Typography>
                                {example.translationVi ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mt: 0.5, ml: 1.5 }}
                                  >
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

                {/* Right Column: Collections, Source Article & Actions */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack spacing={2.5}>
                    {/* Collections Card */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>
                            Bộ sưu tập
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            color="primary"
                            onClick={() => setIsAddCollectionOpen(true)}
                            sx={{ fontWeight: 700 }}
                          >
                            + Thêm
                          </Button>
                        </Stack>

                        {collections.length > 0 ? (
                          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }} useFlexGap>
                            {collections.map((col) => (
                              <Chip
                                key={col.id}
                                label={col.name}
                                onDelete={() => handleRemoveFromCollection(col.id)}
                                disabled={removeCollectionMutation.isPending}
                                variant="outlined"
                                color="primary"
                                size="small"
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Từ này chưa được đưa vào bộ sưu tập nào.
                          </Typography>
                        )}
                      </Stack>
                    </Paper>

                    {/* Source Article Card */}
                    {sourceArticle ? (
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'hidden',
                        }}
                      >
                        {sourceArticle.thumbnailUrl ? (
                          <CardMedia
                            component="img"
                            height="110"
                            image={sourceArticle.thumbnailUrl}
                            alt={sourceArticle.title}
                            sx={{ objectFit: 'cover' }}
                          />
                        ) : null}
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                            Bài báo gốc
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 750,
                              mb: 0.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {sourceArticle.title}
                          </Typography>
                          {sourceArticle.sourceName ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                              Nguồn: {sourceArticle.sourceName}
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
                              onClick={onClose}
                              sx={{ fontWeight: 700, borderRadius: 2 }}
                            >
                              Đọc bài báo
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    ) : null}

                    {/* Delete Action */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'error.light',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" color="error" sx={{ fontWeight: 750 }}>
                            Xóa khỏi từ đã lưu
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Xóa từ vựng này khỏi tài khoản của bạn.
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => setDeleteDialogOpen(true)}
                          disabled={deleteMutation.isPending}
                          sx={{ fontWeight: 700 }}
                        >
                          Xóa
                        </Button>
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 650 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-Dialog: Add to Collection */}
      {userVocabularyId && (
        <AddToCollectionDialog
          open={isAddCollectionOpen}
          onClose={() => setIsAddCollectionOpen(false)}
          userVocabularyId={userVocabularyId}
          existingCollections={collections}
        />
      )}

      {/* Sub-Dialog: Confirm Deletion */}
      {vocabulary && (
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="dialog-delete-vocabulary-title"
        >
          <DialogTitle id="dialog-delete-vocabulary-title">
            Xóa từ vựng đã lưu?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Bạn có chắc chắn muốn xóa từ &quot;{vocabulary.savedWordDisplay}&quot; khỏi danh sách từ vựng đã lưu không? Hành động này cũng sẽ xóa từ khỏi tất cả bộ sưu tập.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
            <Button
              onClick={handleDeleteVocabulary}
              color="error"
              variant="contained"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
