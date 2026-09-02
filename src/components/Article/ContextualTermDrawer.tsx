import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { normalizeApiError } from '@/config/apiClient'
import { CreateCollectionDialog } from '@/components/Vocabulary/CreateCollectionDialog'
import { useAddCollectionItemsMutation, useCollectionsQuery } from '@/hooks/Vocabulary/useCollections'
import { useContextualTermQuery } from '@/hooks/Reading/useReading'
import { useSaveVocabularyMutation } from '@/hooks/Vocabulary/useVocabularies'
import {
  saveVocabularyFormSchema,
  toSaveVocabularyRequest,
  type SaveVocabularyFormOutput,
  type SaveVocabularyFormValues,
} from '@/schemas/Vocabulary/vocabulary'
import type { AddCollectionItemsResponse } from '@/api/Vocabulary/CollectionsApi'
import type { ContextualTermLookupData } from '@/types/Reading/reading'
import type { CollectionListItem } from '@/types/Vocabulary/vocabulary'

interface DisplayExample {
  sentence: string
  translationVi: string | null
}

const displayExamples = (examples: unknown[]): DisplayExample[] =>
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
      'translationVi' in example &&
      typeof example.translationVi === 'string'
        ? example.translationVi
        : null

    return [{ sentence: example.sentence, translationVi }]
  })

const hasText = (value: string | null): value is string =>
  Boolean(value?.trim())

const savePanelSx = {
  p: { xs: 2, sm: 2.25 },
  borderRadius: 2.5,
  borderLeft: 4,
  borderLeftColor: 'primary.main',
  bgcolor: 'rgba(15, 81, 56, 0.035)',
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Box component="section">
      <Typography
        component="h3"
        sx={{
          mb: 1.25,
          fontSize: 13,
          fontWeight: 850,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function TermList({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  if (items.length === 0) return null

  return (
    <DetailSection title={title}>
      <Box
        component="ul"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          p: 0,
          m: 0,
          listStyle: 'none',
        }}
      >
        {items.map((item, index) => (
          <Box component="li" key={`${item}:${index}`}>
            <Chip label={item} size="small" variant="outlined" />
          </Box>
        ))}
      </Box>
    </DetailSection>
  )
}

const saveErrorKey = (error: unknown) => {
  const normalized = normalizeApiError(error)
  if (normalized.status === 401) {
    return 'lookup.save.errors.signIn' as const
  }
  if (normalized.status === 422) {
    return 'lookup.save.errors.collectionsUnavailable' as const
  }
  return 'lookup.save.errors.generic' as const
}

function SaveVocabularyForm({
  articleId,
  data,
}: {
  articleId: string
  data: ContextualTermLookupData
}) {
  const { t } = useTranslation('articles')
  const saveMutation = useSaveVocabularyMutation(articleId, data.term.id)
  const addCollectionMutation = useAddCollectionItemsMutation()
  const { data: collectionsData, isLoading: isLoadingCollections } =
    useCollectionsQuery({ limit: 100 })
  const collections = useMemo(
    () => collectionsData?.items ?? [],
    [collectionsData?.items],
  )

  const [addCollectionId, setAddCollectionId] = useState<string>('')
  const [addFeedback, setAddFeedback] = useState<string | null>(null)
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false)

  const isDefaultInitializedRef = useRef(false)

  const {
    control,
    formState: { errors, isDirty },
    getValues,
    handleSubmit,
    setValue,
  } = useForm<
    SaveVocabularyFormValues,
    unknown,
    SaveVocabularyFormOutput
  >({
    resolver: zodResolver(saveVocabularyFormSchema),
    defaultValues: {
      collectionIds: collections.length > 0 ? [collections[0].id] : [],
    },
  })

  useEffect(() => {
    if (isDefaultInitializedRef.current) return
    if (collections.length > 0) {
      const current = getValues('collectionIds')
      if (!current || current.length === 0) {
        setValue('collectionIds', [collections[0].id])
      }
      isDefaultInitializedRef.current = true
    }
  }, [collections, getValues, setValue])

  const submit = handleSubmit((values) => {
    saveMutation.mutate(toSaveVocabularyRequest(data.term.id, values))
  })

  const addSavedVocabularyToCollection = (collectionId: string) => {
    if (!data.saveState.userVocabularyId) return
    setAddFeedback(null)
    addCollectionMutation.mutate(
      {
        collectionId,
        userVocabularyIds: [data.saveState.userVocabularyId],
      },
      {
        onSuccess: (res: AddCollectionItemsResponse) => {
          if (res.skippedCount > 0) {
            setAddFeedback(t('lookup.save.additional.alreadyAdded'))
          } else {
            setAddFeedback(t('lookup.save.additional.added'))
          }
          setAddCollectionId('')
        },
        onError: () => {
          setAddFeedback(t('lookup.save.additional.error'))
        },
      },
    )
  }

  const handleAddToAdditionalCollection = () => {
    if (!addCollectionId) return
    addSavedVocabularyToCollection(addCollectionId)
  }

  const handleCollectionCreated = (collectionId: string) => {
    if (data.saveState.isSaved) {
      addSavedVocabularyToCollection(collectionId)
      return
    }

    isDefaultInitializedRef.current = true
    const current = getValues('collectionIds') ?? []
    const nextCollectionIds = isDirty
      ? Array.from(new Set([...current, collectionId]))
      : [collectionId]

    setValue('collectionIds', nextCollectionIds, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  if (data.saveState.isSaved) {
    return (
      <>
        {data.saveState.userVocabularyId ? (
          <Paper variant="outlined" sx={savePanelSx}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('lookup.save.additional.title')}
              </Typography>
              <Button
                size="small"
                onClick={() => setIsCreateCollectionOpen(true)}
              >
                {t('lookup.save.quickCreate.action')}
              </Button>
            </Stack>

            {addFeedback ? (
              <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                {addFeedback}
              </Alert>
            ) : null}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {collections.length === 0 ? (
                  <Box
                    role="status"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 40,
                      px: 1.5,
                      border: '1px solid',
                      borderColor: 'warning.light',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('lookup.save.noCollections')}
                    </Typography>
                  </Box>
                ) : (
                <FormControl size="small" fullWidth>
                  <InputLabel id="add-to-collection-select-label">
                    {t('lookup.save.additional.selectLabel')}
                  </InputLabel>
                  <Select
                    labelId="add-to-collection-select-label"
                    value={addCollectionId}
                    label={t('lookup.save.additional.selectLabel')}
                    onChange={(e) => setAddCollectionId(e.target.value)}
                    disabled={addCollectionMutation.isPending}
                  >
                    {collections.map((col: CollectionListItem) => (
                      <MenuItem key={col.id} value={col.id}>
                        {col.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                )}
              </Box>

              <Button
                variant="outlined"
                onClick={handleAddToAdditionalCollection}
                disabled={
                  collections.length === 0 ||
                  !addCollectionId ||
                  addCollectionMutation.isPending
                }
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                {addCollectionMutation.isPending
                  ? t('lookup.save.additional.adding')
                  : t('lookup.save.additional.add')}
              </Button>
            </Stack>
          </Paper>
        ) : null}
        <CreateCollectionDialog
          open={isCreateCollectionOpen}
          onClose={() => setIsCreateCollectionOpen(false)}
          onSuccess={handleCollectionCreated}
        />
      </>
    )
  }

  const saveError = saveMutation.error
    ? normalizeApiError(saveMutation.error)
    : null

  return (
    <>
      <Box
        component="form"
        onSubmit={submit}
        autoComplete="off"
        noValidate
      >
        <Paper variant="outlined" sx={savePanelSx}>
          <Stack spacing={2.25}>
            {saveError?.status === 409 ? (
              <Alert severity="info" aria-live="polite">
                {t('lookup.save.alreadySaved')}
              </Alert>
            ) : saveMutation.error ? (
              <Alert severity="error">
                {t(saveErrorKey(saveMutation.error))}
              </Alert>
            ) : null}

            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('lookup.save.additional.title')}
              </Typography>
              <Button
                size="small"
                onClick={() => setIsCreateCollectionOpen(true)}
              >
                {t('lookup.save.quickCreate.action')}
              </Button>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { xs: 'stretch', sm: 'flex-start' } }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {isLoadingCollections ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 40,
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : collections.length > 0 ? (
                  <Controller
                    name="collectionIds"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={Boolean(errors.collectionIds)}
                        size="small"
                      >
                        <InputLabel id="select-collections-label">
                          {t('lookup.save.collectionsLabel')}
                        </InputLabel>
                        <Select
                          labelId="select-collections-label"
                          multiple
                          value={field.value}
                          onChange={field.onChange}
                          input={
                            <OutlinedInput label={t('lookup.save.collectionsLabel')} />
                          }
                          renderValue={(selected) =>
                            collections
                              .filter((c: CollectionListItem) => selected.includes(c.id))
                              .map((c: CollectionListItem) => c.name)
                              .join(', ')
                          }
                        >
                          {collections.map((col: CollectionListItem) => (
                            <MenuItem key={col.id} value={col.id}>
                              <Checkbox checked={field.value.includes(col.id)} />
                              <ListItemText primary={col.name} />
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.collectionIds ? (
                          <FormHelperText>
                            {t('lookup.save.errors.collectionRequired')}
                          </FormHelperText>
                        ) : (
                          <FormHelperText>
                            {t('lookup.save.collectionsHelp')}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                ) : (
                  <Box
                    role="status"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 40,
                      px: 1.5,
                      border: '1px solid',
                      borderColor: 'warning.light',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('lookup.save.noCollections')}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="small"
                disabled={
                  saveMutation.isPending ||
                  isLoadingCollections ||
                  collections.length === 0
                }
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                {saveMutation.isPending
                  ? t('lookup.save.saving')
                  : t('lookup.save.submit')}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
      <CreateCollectionDialog
        open={isCreateCollectionOpen}
        onClose={() => setIsCreateCollectionOpen(false)}
        onSuccess={handleCollectionCreated}
      />
    </>
  )
}

function LookupDetails({
  articleId,
  data,
}: {
  articleId: string
  data: ContextualTermLookupData
}) {
  const { t } = useTranslation('articles')
  const { term, parentSentence } = data
  const examples = displayExamples(term.examples)
  const hasOptionalIdentity = hasText(term.ipa)

  return (
    <Stack spacing={3} sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderLeft: 5,
          borderLeftColor: 'secondary.main',
          bgcolor: 'secondary.light',
        }}
      >
        <Typography
          sx={{
            color: 'secondary.dark',
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {t('lookup.details.meaningInSentence')}
        </Typography>
        <Typography
          sx={{
            mt: 1,
            fontFamily: '"Be Vietnam Pro", "Inter", sans-serif',
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.35,
            overflowWrap: 'anywhere',
          }}
        >
          {(term.contextualMeaningVi ?? t('lookup.details.meaningUnavailable')).normalize('NFC')}
        </Typography>
      </Paper>

      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 2,
          m: 0,
          '& dt': {
            color: 'text.secondary',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          },
          '& dd': { m: 0, mt: 0.5, overflowWrap: 'anywhere' },
        }}
      >
        <Box>
          <Typography component="dt">{t('lookup.details.lemma')}</Typography>
          <Typography component="dd">{term.lemma}</Typography>
        </Box>
        <Box>
          <Typography component="dt">{t('lookup.details.partOfSpeech')}</Typography>
          <Typography component="dd">{term.partOfSpeech}</Typography>
        </Box>
        <Box>
          <Typography component="dt">{t('lookup.details.cefrLevel')}</Typography>
          <Typography component="dd">{term.cefrLevel}</Typography>
        </Box>
        {hasOptionalIdentity && hasText(term.ipa) ? (
          <Box>
            <Typography component="dt">IPA</Typography>
            <Typography component="dd">{term.ipa}</Typography>
          </Box>
        ) : null}
      </Box>

      {hasText(term.definitionEn) ? (
        <DetailSection title={t('lookup.sections.englishDefinition')}>
          <Typography sx={{ lineHeight: 1.7 }}>
            {term.definitionEn}
          </Typography>
        </DetailSection>
      ) : null}

      {hasText(term.contextualExplanation) ? (
        <DetailSection title={t('lookup.sections.contextualExplanation')}>
          <Typography sx={{ lineHeight: 1.7 }}>
            {term.contextualExplanation}
          </Typography>
        </DetailSection>
      ) : null}

      <DetailSection title={t('lookup.sections.sourceSentence')}>
        <Paper
          component="blockquote"
          variant="outlined"
          sx={{ p: 2.5, m: 0, bgcolor: 'primary.light' }}
        >
          <Typography
            sx={{
              fontFamily: '"Merriweather", "Be Vietnam Pro", serif',
              fontSize: 19,
              lineHeight: 1.65,
            }}
          >
            {parentSentence.sentenceText?.normalize('NFC')}
          </Typography>
          {hasText(parentSentence.translationVi) ? (
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6 }}>
              {parentSentence.translationVi?.normalize('NFC')}
            </Typography>
          ) : null}
        </Paper>
      </DetailSection>

      {examples.length > 0 ? (
        <DetailSection title={t('lookup.sections.examples')}>
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            {examples.map((example, index) => (
              <Box
                component="li"
                key={`${example.sentence}:${index}`}
                sx={{ pl: 0.75, '& + &': { mt: 1.5 } }}
              >
                <Typography sx={{ lineHeight: 1.6 }}>
                  {example.sentence}
                </Typography>
                {hasText(example.translationVi) ? (
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ mt: 0.5, lineHeight: 1.55 }}
                  >
                    {example.translationVi}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Box>
        </DetailSection>
      ) : null}

      <TermList title={t('lookup.sections.synonyms')} items={term.synonyms} />
      <TermList title={t('lookup.sections.antonyms')} items={term.antonyms} />
      <TermList title={t('lookup.sections.collocations')} items={term.collocations} />
      <TermList title={t('lookup.sections.relatedTerms')} items={term.relatedTerms} />

      <Divider />

      <DetailSection title={t('lookup.sections.saveTerm')}>
        <SaveVocabularyForm key={data.term.id} articleId={articleId} data={data} />
      </DetailSection>
    </Stack>
  )
}

interface ContextualTermDrawerProps {
  articleId: string
  termId: string | null
  open: boolean
  onClose: () => void
}

export function ContextualTermDrawer({
  articleId,
  termId,
  open,
  onClose,
}: ContextualTermDrawerProps) {
  const { t } = useTranslation('articles')
  const lookupQuery = useContextualTermQuery(
    articleId,
    termId ?? '',
    open,
  )
  const apiError = lookupQuery.error
    ? normalizeApiError(lookupQuery.error)
    : null

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={0}
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(15, 81, 56, 0.18)' },
        },
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': 'contextual-term-drawer-title',
          'aria-describedby': 'contextual-term-drawer-description',
          sx: {
            width: { xs: '100%', sm: 500, md: 540 },
            maxWidth: '100%',
            overscrollBehavior: 'contain',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id="contextual-term-drawer-title"
              component="h2"
              variant="h1"
              sx={{
                fontSize: { xs: 30, sm: 36 },
                overflowWrap: 'anywhere',
                textWrap: 'balance',
              }}
            >
              {lookupQuery.data?.term.value ?? t('lookup.title')}
            </Typography>
            <Typography
              id="contextual-term-drawer-description"
              color="text.secondary"
              variant="body2"
              sx={{ mt: 0.5 }}
            >
              {t('lookup.description')}
            </Typography>
          </Box>
          <Button type="button" color="inherit" onClick={onClose}>
            {t('lookup.close')}
          </Button>
        </Stack>
      </Box>

      {lookupQuery.isPending ? (
        <Stack
          role="status"
          spacing={1.5}
          sx={{
            minHeight: 360,
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <CircularProgress size={34} />
          <Typography color="text.secondary">
            {t('lookup.loading')}
          </Typography>
        </Stack>
      ) : lookupQuery.isError ? (
        <Stack spacing={2} sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Alert severity={apiError?.status === 403 ? 'warning' : 'error'}>
            {apiError?.status === 403
              ? t('lookup.errors.disabled')
              : apiError?.status === 404
                ? t('lookup.errors.notFound')
                : apiError?.status === 409 || apiError?.status === 503
                  ? t('lookup.errors.preparing')
                  : t('lookup.errors.load')}
          </Alert>
          {apiError?.status !== 403 && apiError?.status !== 404 ? (
            <Button
              variant="outlined"
              onClick={() => lookupQuery.refetch()}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('lookup.tryAgain')}
            </Button>
          ) : null}
        </Stack>
      ) : lookupQuery.data ? (
        <LookupDetails
          key={lookupQuery.data.term.id}
          articleId={articleId}
          data={lookupQuery.data}
        />
      ) : null}
    </Drawer>
  )
}
