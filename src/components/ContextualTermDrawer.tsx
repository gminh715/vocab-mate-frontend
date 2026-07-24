import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { normalizeApiError } from '../config/apiClient'
import { useContextualTermQuery } from '../hooks/useReading'
import { useSaveVocabularyMutation } from '../hooks/useVocabularies'
import {
  saveVocabularyFormSchema,
  toSaveVocabularyRequest,
  type SaveVocabularyFormOutput,
  type SaveVocabularyFormValues,
} from '../schemas/vocabulary'
import type { ContextualTermLookupData } from '../types/reading'
import type { LearningStatus } from '../types/vocabulary'

const learningStatusLabels: Record<LearningStatus, string> = {
  NEW: 'New',
  LEARNING: 'Learning',
  REVIEWING: 'Reviewing',
  MASTERED: 'Mastered',
  IGNORED: 'Ignored',
}

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
  const apiError = normalizeApiError(error)

  if (apiError.status === 403) {
    return 'Saving is unavailable because lookup has been disabled for this term.'
  }
  if (apiError.status === 404) {
    return 'This contextual term is no longer available to save.'
  }
  if (apiError.status === 422) {
    if (apiError.message.toLowerCase().includes('collection')) {
      return 'One or more selected collections are no longer available. Review your collections and try again.'
    }
    return 'This term is missing required prepared content and cannot be saved yet.'
  }

  return apiError.status === 0
    ? apiError.message
    : 'Vocabulary could not be saved. Try again.'
}

function SaveVocabularyForm({
  articleId,
  data,
}: {
  articleId: string
  data: ContextualTermLookupData
}) {
  const saveMutation = useSaveVocabularyMutation(articleId, data.term.id)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<
    SaveVocabularyFormValues,
    unknown,
    SaveVocabularyFormOutput
  >({
    resolver: zodResolver(saveVocabularyFormSchema),
    defaultValues: { personalNote: '' },
  })
  const submit = handleSubmit((values) => {
    saveMutation.mutate(toSaveVocabularyRequest(data.term.id, values))
  })

  if (data.saveState.isSaved) {
    return (
      <Alert severity="success" aria-live="polite">
        <AlertTitle>Saved to vocabulary</AlertTitle>
        {data.saveState.learningStatus
          ? `Status: ${learningStatusLabels[data.saveState.learningStatus]}.`
          : 'This contextual term is already in your vocabulary.'}
      </Alert>
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
          disabled={saveMutation.isPending}
          sx={{ alignSelf: 'flex-start' }}
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
