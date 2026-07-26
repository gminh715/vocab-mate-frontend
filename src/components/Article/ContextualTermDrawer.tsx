import { useMemo, useState } from 'react'
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import { normalizeApiError } from '@/config/apiClient'
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

const saveErrorMessage = (error: unknown): string => {
  const normalized = normalizeApiError(error)
  if (normalized.status === 401) {
    return 'Sign in to save vocabulary.'
  }
  if (normalized.status === 422) {
    return 'One or more selected collections are no longer available. Review your collections and try again.'
  }
  return 'Vocabulary could not be saved. Try again.'
}

function SaveVocabularyForm({
  articleId,
  data,
}: {
  articleId: string
  data: ContextualTermLookupData
}) {
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

  const defaultCollectionIds = useMemo(
    () => (collections.length > 0 ? [collections[0].id] : []),
    [collections],
  )

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<
    SaveVocabularyFormValues,
    unknown,
    SaveVocabularyFormOutput
  >({
    resolver: zodResolver(saveVocabularyFormSchema),
    values: { personalNote: '', collectionIds: defaultCollectionIds },
    resetOptions: { keepDefaultValues: false },
  })

  const submit = handleSubmit((values) => {
    saveMutation.mutate(toSaveVocabularyRequest(data.term.id, values))
  })

  const handleAddToAdditionalCollection = () => {
    if (!addCollectionId || !data.saveState.userVocabularyId) return
    setAddFeedback(null)
    addCollectionMutation.mutate(
      {
        collectionId: addCollectionId,
        userVocabularyIds: [data.saveState.userVocabularyId],
      },
      {
        onSuccess: (res: AddCollectionItemsResponse) => {
          if (res.skippedCount > 0) {
            setAddFeedback('Word is already in this collection.')
          } else {
            setAddFeedback('Added to collection successfully!')
          }
          setAddCollectionId('')
        },
        onError: () => {
          setAddFeedback('Failed to add to collection.')
        },
      },
    )
  }

  if (data.saveState.isSaved) {
    return (
      <Stack spacing={2}>
        {data.saveState.userVocabularyId && collections.length > 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Add to another Collection
            </Typography>

            {addFeedback ? (
              <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                {addFeedback}
              </Alert>
            ) : null}

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="add-to-collection-select-label">Select Collection</InputLabel>
                <Select
                  labelId="add-to-collection-select-label"
                  value={addCollectionId}
                  label="Select Collection"
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

              <Button
                variant="outlined"
                onClick={handleAddToAdditionalCollection}
                disabled={!addCollectionId || addCollectionMutation.isPending}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {addCollectionMutation.isPending ? 'Adding…' : 'Add'}
              </Button>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    )
  }

  const saveError = saveMutation.error
    ? normalizeApiError(saveMutation.error)
    : null

  return (
    <Box
      component="form"
      onSubmit={submit}
      autoComplete="off"
      noValidate
    >
      <Stack spacing={2}>
        {saveError?.status === 409 ? (
          <Alert severity="info" aria-live="polite">
            This term is already saved. Refreshing its saved state…
          </Alert>
        ) : saveMutation.error ? (
          <Alert severity="error">{saveErrorMessage(saveMutation.error)}</Alert>
        ) : null}

        {isLoadingCollections ? (
          <CircularProgress size={24} />
        ) : collections.length === 0 ? (
          <Alert severity="warning">
            You don&apos;t have any collections yet. Please create a collection first before saving vocabulary.
          </Alert>
        ) : (
          <Controller
            name="collectionIds"
            control={control}
            defaultValue={[collections[0]?.id].filter(Boolean)}
            render={({ field }) => (
              <FormControl
                fullWidth
                error={Boolean(errors.collectionIds)}
                size="small"
              >
                <InputLabel id="select-collections-label">
                  Collections (Required)
                </InputLabel>
                <Select
                  labelId="select-collections-label"
                  multiple
                  value={field.value}
                  onChange={field.onChange}
                  input={<OutlinedInput label="Collections (Required)" />}
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
                  <FormHelperText>{errors.collectionIds.message}</FormHelperText>
                ) : (
                  <FormHelperText>
                    Select one or more collections to add this word to.
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        )}

        <TextField
          label="Personal note (optional)"
          multiline
          minRows={2}
          error={Boolean(errors.personalNote)}
          helperText={
            errors.personalNote?.message ??
            'Add a note for this contextual occurrence.'
          }
          slotProps={{ htmlInput: { maxLength: 2_000 } }}
          {...register('personalNote')}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={saveMutation.isPending || isLoadingCollections || collections.length === 0}
          fullWidth
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Vocabulary'}
        </Button>
      </Stack>
    </Box>
  )
}

function LookupDetails({
  articleId,
  data,
}: {
  articleId: string
  data: ContextualTermLookupData
}) {
  const { term, parentSentence } = data
  const examples = displayExamples(term.examples)
  const hasOptionalIdentity =
    hasText(term.ipa) ||
    hasText(term.vocabularyTopic) ||
    hasText(term.skill)

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
          Meaning in this sentence
        </Typography>
        <Typography
          sx={{
            mt: 1,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 25,
            fontWeight: 700,
            lineHeight: 1.35,
            overflowWrap: 'anywhere',
          }}
        >
          {term.contextualMeaningVi}
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
          <Typography component="dt">Lemma</Typography>
          <Typography component="dd">{term.lemma}</Typography>
        </Box>
        <Box>
          <Typography component="dt">Part of speech</Typography>
          <Typography component="dd">{term.partOfSpeech}</Typography>
        </Box>
        <Box>
          <Typography component="dt">CEFR level</Typography>
          <Typography component="dd">{term.cefrLevel}</Typography>
        </Box>
        <Box>
          <Typography component="dt">Term type</Typography>
          <Typography component="dd">
            {term.unitType === 'PHRASE' ? 'Phrase' : 'Word'}
          </Typography>
        </Box>
        {hasOptionalIdentity && hasText(term.ipa) ? (
          <Box>
            <Typography component="dt">IPA</Typography>
            <Typography component="dd">{term.ipa}</Typography>
          </Box>
        ) : null}
        {hasOptionalIdentity && hasText(term.vocabularyTopic) ? (
          <Box>
            <Typography component="dt">Topic</Typography>
            <Typography component="dd">{term.vocabularyTopic}</Typography>
          </Box>
        ) : null}
        {hasOptionalIdentity && hasText(term.skill) ? (
          <Box>
            <Typography component="dt">Skill</Typography>
            <Typography component="dd">{term.skill}</Typography>
          </Box>
        ) : null}
      </Box>

      {hasText(term.definitionEn) ? (
        <DetailSection title="English definition">
          <Typography sx={{ lineHeight: 1.7 }}>
            {term.definitionEn}
          </Typography>
        </DetailSection>
      ) : null}

      {hasText(term.contextualExplanation) ? (
        <DetailSection title="Contextual explanation">
          <Typography sx={{ lineHeight: 1.7 }}>
            {term.contextualExplanation}
          </Typography>
        </DetailSection>
      ) : null}

      <DetailSection title="Source sentence">
        <Paper
          component="blockquote"
          variant="outlined"
          sx={{ p: 2.5, m: 0, bgcolor: 'primary.light' }}
        >
          <Typography
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 19,
              lineHeight: 1.65,
            }}
          >
            {parentSentence.sentenceText}
          </Typography>
          {hasText(parentSentence.translationVi) ? (
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6 }}>
              {parentSentence.translationVi}
            </Typography>
          ) : null}
        </Paper>
      </DetailSection>

      {hasText(parentSentence.explanationVi) ? (
        <DetailSection title="Sentence explanation">
          <Typography sx={{ lineHeight: 1.7 }}>
            {parentSentence.explanationVi}
          </Typography>
        </DetailSection>
      ) : null}

      {hasText(parentSentence.referenceExplanation) ? (
        <DetailSection title="Reference note">
          <Typography sx={{ lineHeight: 1.7 }}>
            {parentSentence.referenceExplanation}
          </Typography>
        </DetailSection>
      ) : null}

      {examples.length > 0 ? (
        <DetailSection title="Examples">
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

      <TermList title="Synonyms" items={term.synonyms} />
      <TermList title="Antonyms" items={term.antonyms} />
      <TermList title="Collocations" items={term.collocations} />
      <TermList title="Related terms" items={term.relatedTerms} />

      <Divider />

      <DetailSection title="Save this term">
        <SaveVocabularyForm articleId={articleId} data={data} />
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
              sx={{
                color: 'secondary.dark',
                fontSize: 11,
                fontWeight: 850,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Contextual vocabulary
            </Typography>
            <Typography
              id="contextual-term-drawer-title"
              component="h2"
              variant="h1"
              sx={{
                mt: 0.5,
                fontSize: { xs: 30, sm: 36 },
                overflowWrap: 'anywhere',
                textWrap: 'balance',
              }}
            >
              {lookupQuery.data?.term.wordDisplay ?? 'Vocabulary lookup'}
            </Typography>
            <Typography
              id="contextual-term-drawer-description"
              color="text.secondary"
              variant="body2"
              sx={{ mt: 0.5 }}
            >
              Details for this sentence occurrence.
            </Typography>
          </Box>
          <Button type="button" color="inherit" onClick={onClose}>
            Close
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
            Loading vocabulary details…
          </Typography>
        </Stack>
      ) : lookupQuery.isError ? (
        <Stack spacing={2} sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Alert severity={apiError?.status === 403 ? 'warning' : 'error'}>
            {apiError?.status === 403
              ? 'Lookup is disabled for this contextual term.'
              : apiError?.status === 404
                ? 'This contextual term is no longer available in the article.'
                : 'Vocabulary details could not be loaded. Try again.'}
          </Alert>
          {apiError?.status !== 403 && apiError?.status !== 404 ? (
            <Button
              variant="outlined"
              onClick={() => lookupQuery.refetch()}
              sx={{ alignSelf: 'flex-start' }}
            >
              Try again
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
