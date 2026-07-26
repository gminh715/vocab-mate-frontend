import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import {
  articleTermFormSchema,
  toCreateArticleTermRequest,
  toUpdateArticleTermRequest,
  type ArticleTermFormOutput,
  type ArticleTermFormValues,
} from '@/schemas/Admin/adminArticleContent'
import type {
  ArticleSentence,
  ArticleSentenceTerm,
  CreateArticleTermRequest,
  UpdateArticleTermRequest,
} from '@/types/Admin/adminArticleContent'
import { LEXICAL_UNIT_TYPES } from '@/types/Admin/adminArticleContent'
import { CEFR_LEVELS } from '@/types/Auth/auth'

interface CreateTermDrawerProps {
  mode: 'create'
  sentence: ArticleSentence
  term?: never
  open: boolean
  isPending: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (request: CreateArticleTermRequest) => Promise<void>
}

interface EditTermDrawerProps {
  mode: 'edit'
  sentence: ArticleSentence
  term: ArticleSentenceTerm
  open: boolean
  isPending: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (request: UpdateArticleTermRequest) => Promise<void>
}

type ArticleTermDrawerProps = CreateTermDrawerProps | EditTermDrawerProps

const emptyTermValues: ArticleTermFormValues = {
  value: '',
  wordDisplay: '',
  lemma: '',
  normalizedLemma: '',
  unitType: 'WORD',
  partOfSpeech: '',
  ipa: '',
  cefrLevel: 'B1',
  contextualMeaningVi: '',
  definitionEn: '',
  contextualExplanation: '',
  synonyms: [],
  antonyms: [],
  collocations: [],
  relatedTerms: [],
  vocabularyTopic: '',
  examples: [],
  skill: '',
  isLookupEnabled: true,
  isActive: true,
}

const termValues = (
  term: ArticleSentenceTerm,
): ArticleTermFormValues => ({
  value: term.value,
  wordDisplay: term.wordDisplay,
  lemma: term.lemma,
  normalizedLemma: term.normalizedLemma,
  unitType: term.unitType,
  partOfSpeech: term.partOfSpeech,
  ipa: term.ipa ?? '',
  cefrLevel: term.cefrLevel,
  contextualMeaningVi: term.contextualMeaningVi,
  definitionEn: term.definitionEn ?? '',
  contextualExplanation: term.contextualExplanation ?? '',
  synonyms: term.synonyms,
  antonyms: term.antonyms,
  collocations: term.collocations,
  relatedTerms: term.relatedTerms,
  vocabularyTopic: term.vocabularyTopic ?? '',
  examples: term.examples,
  skill: term.skill ?? '',
  isLookupEnabled: term.isLookupEnabled,
  isActive: term.isActive,
})

interface StringArrayInputProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

function StringArrayInput({
  label,
  value,
  onChange,
  error,
}: StringArrayInputProps) {
  const [draft, setDraft] = useState('')

  const addValue = () => {
    const nextValue = draft.trim()
    if (!nextValue || value.includes(nextValue)) return
    onChange([...value, nextValue])
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addValue()
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          label={label}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          error={Boolean(error)}
          helperText={error ?? 'Type a value, then add it.'}
        />
        <Button
          type="button"
          variant="outlined"
          onClick={addValue}
          disabled={!draft.trim()}
          sx={{ flexShrink: 0 }}
        >
          Add
        </Button>
      </Stack>
      {value.length > 0 ? (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ flexWrap: 'wrap', gap: 0.75 }}
        >
          {value.map((item) => (
            <Chip
              key={item}
              label={item}
              onDelete={() =>
                onChange(value.filter((valueItem) => valueItem !== item))
              }
              size="small"
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Box>
      <Typography variant="h2" sx={{ fontSize: 22 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        {description}
      </Typography>
    </Box>
  )
}

export function ArticleTermDrawer(props: ArticleTermDrawerProps) {
  const editTerm = props.mode === 'edit' ? props.term : null
  const defaultValues = useMemo(
    () => (editTerm ? termValues(editTerm) : emptyTermValues),
    [editTerm],
  )
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<
    ArticleTermFormValues,
    unknown,
    ArticleTermFormOutput
  >({
    resolver: zodResolver(articleTermFormSchema),
    defaultValues,
  })
  const examples = useFieldArray({ control, name: 'examples' })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  useEffect(() => {
    if (!isDirty || props.isPending) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty, props.isPending])

  const requestClose = () => {
    if (
      isDirty &&
      !props.isPending &&
      !window.confirm('Discard unsaved contextual term changes?')
    ) {
      return
    }
    props.onClose()
  }

  const submit = handleSubmit(async (values) => {
    if (props.mode === 'create') {
      await props.onSubmit(toCreateArticleTermRequest(values))
      return
    }

    const optionalFields = [
      ['ipa', 'IPA'],
      ['definitionEn', 'English definition'],
      ['contextualExplanation', 'Contextual explanation'],
      ['vocabularyTopic', 'Vocabulary topic'],
      ['skill', 'Skill'],
    ] as const
    const clearedField = optionalFields.find(
      ([name]) => defaultValues[name] && !values[name],
    )
    if (clearedField) {
      setError(clearedField[0], {
        message: `The current API cannot clear ${clearedField[1].toLowerCase()}. Enter a replacement value.`,
      })
      return
    }

    const request = toUpdateArticleTermRequest(
      values,
      articleTermFormSchema.parse(defaultValues),
    )
    if (Object.keys(request).length === 0) {
      reset(values)
      return
    }
    await props.onSubmit(request)
  })

  return (
    <Drawer
      anchor="right"
      open={props.open}
      onClose={props.isPending ? undefined : requestClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-labelledby': 'term-drawer-title',
          sx: {
            width: { xs: '100%', sm: 680, lg: 760 },
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
          zIndex: 1,
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
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id="term-drawer-title"
              variant="h1"
              sx={{ fontSize: 30 }}
            >
              {props.mode === 'create' ? 'Add contextual term' : 'Edit term'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Metadata applies only to this sentence occurrence.
            </Typography>
          </Box>
          <Button
            type="button"
            color="inherit"
            onClick={requestClose}
            disabled={props.isPending}
          >
            Close
          </Button>
        </Stack>
      </Box>

      <Box
        component="form"
        onSubmit={submit}
        autoComplete="off"
        noValidate
        sx={{ p: { xs: 2.5, sm: 3.5 } }}
      >
        <Stack spacing={3}>
          {props.serverError ? (
            <Alert severity="error">{props.serverError}</Alert>
          ) : null}

          <Paper
            variant="outlined"
            sx={{ p: 2.5, bgcolor: 'primary.light' }}
          >
            <Typography
              sx={{
                color: 'primary.dark',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Source sentence · read only
            </Typography>
            <Typography
              sx={{
                mt: 1,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 18,
                lineHeight: 1.55,
              }}
            >
              {props.sentence.sentenceText}
            </Typography>
          </Paper>

          <SectionHeading
            title="Identity"
            description="The value must occur in the selected sentence. Marker placement stays backend-owned."
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              label="Term value"
              error={Boolean(errors.value)}
              helperText={errors.value?.message}
              {...register('value')}
            />
            <TextField
              label="Display form"
              error={Boolean(errors.wordDisplay)}
              helperText={errors.wordDisplay?.message}
              {...register('wordDisplay')}
            />
            <TextField
              label="Lemma"
              error={Boolean(errors.lemma)}
              helperText={errors.lemma?.message}
              {...register('lemma')}
            />
            <TextField
              label="Normalized lemma"
              error={Boolean(errors.normalizedLemma)}
              helperText={errors.normalizedLemma?.message}
              {...register('normalizedLemma')}
            />
            <TextField
              select
              label="Unit type"
              error={Boolean(errors.unitType)}
              helperText={errors.unitType?.message}
              {...register('unitType')}
            >
              {LEXICAL_UNIT_TYPES.map((unitType) => (
                <MenuItem key={unitType} value={unitType}>
                  {unitType === 'WORD' ? 'Word' : 'Phrase'}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Part of speech"
              error={Boolean(errors.partOfSpeech)}
              helperText={errors.partOfSpeech?.message}
              {...register('partOfSpeech')}
            />
            <TextField
              label="IPA"
              error={Boolean(errors.ipa)}
              helperText={errors.ipa?.message}
              {...register('ipa')}
            />
            <TextField
              select
              label="CEFR level"
              error={Boolean(errors.cefrLevel)}
              helperText={errors.cefrLevel?.message}
              {...register('cefrLevel')}
            >
              {CEFR_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Divider />
          <SectionHeading
            title="Context"
            description="Explain this occurrence rather than the lemma in isolation."
          />
          <TextField
            label="Contextual meaning in Vietnamese"
            multiline
            minRows={3}
            error={Boolean(errors.contextualMeaningVi)}
            helperText={errors.contextualMeaningVi?.message}
            {...register('contextualMeaningVi')}
          />
          <TextField
            label="English definition"
            multiline
            minRows={2}
            error={Boolean(errors.definitionEn)}
            helperText={errors.definitionEn?.message}
            {...register('definitionEn')}
          />
          <TextField
            label="Contextual explanation"
            multiline
            minRows={3}
            error={Boolean(errors.contextualExplanation)}
            helperText={errors.contextualExplanation?.message}
            {...register('contextualExplanation')}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              label="Vocabulary topic"
              error={Boolean(errors.vocabularyTopic)}
              helperText={errors.vocabularyTopic?.message}
              {...register('vocabularyTopic')}
            />
            <TextField
              label="Skill"
              error={Boolean(errors.skill)}
              helperText={errors.skill?.message}
              {...register('skill')}
            />
          </Box>

          <Divider />
          <SectionHeading
            title="Relationships"
            description="Add each value separately so it can be removed without rewriting the field."
          />
          {(
            [
              ['synonyms', 'Synonyms'],
              ['antonyms', 'Antonyms'],
              ['collocations', 'Collocations'],
              ['relatedTerms', 'Related terms'],
            ] as const
          ).map(([name, label]) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field, fieldState }) => (
                <StringArrayInput
                  label={label}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}

          <Divider />
          <Stack spacing={2}>
            <SectionHeading
              title="Examples"
              description="Examples are stored as English and Vietnamese pairs."
            />
            {examples.fields.map((field, index) => (
              <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <TextField
                    label={`Example ${index + 1}`}
                    error={Boolean(errors.examples?.[index]?.sentence)}
                    helperText={errors.examples?.[index]?.sentence?.message}
                    {...register(`examples.${index}.sentence`)}
                  />
                  <TextField
                    label="Vietnamese translation"
                    error={Boolean(
                      errors.examples?.[index]?.translationVi,
                    )}
                    helperText={
                      errors.examples?.[index]?.translationVi?.message
                    }
                    {...register(`examples.${index}.translationVi`)}
                  />
                  <Button
                    type="button"
                    color="error"
                    onClick={() => examples.remove(index)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Remove example
                  </Button>
                </Stack>
              </Paper>
            ))}
            <Button
              type="button"
              variant="outlined"
              onClick={() =>
                examples.append({ sentence: '', translationVi: '' })
              }
              disabled={examples.fields.length >= 50}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add example
            </Button>
          </Stack>

          <Divider />
          <Stack>
            <Controller
              control={control}
              name="isLookupEnabled"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label="Enable contextual lookup"
                />
              )}
            />
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label="Active term"
                />
              )}
            />
          </Stack>

          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={1.5}
            sx={{ justifyContent: 'flex-end' }}
          >
            <Button
              type="button"
              color="inherit"
              onClick={requestClose}
              disabled={props.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                props.isPending || (props.mode === 'edit' && !isDirty)
              }
            >
              {props.isPending
                ? 'Saving…'
                : props.mode === 'create'
                  ? 'Add term'
                  : 'Save term'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  )
}
