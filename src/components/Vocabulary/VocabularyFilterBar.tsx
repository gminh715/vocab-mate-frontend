import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { CEFR_LEVELS, type CefrLevel } from '@/types/Auth/auth'
import {
  LEARNING_STATUSES,
  VOCABULARY_SORTS,
  type CollectionListItem,
  type GetVocabulariesQueryParams,
  type LearningStatus,
  type VocabularySort,
} from '@/types/Vocabulary/vocabulary'
import { useCollectionsQuery } from '@/hooks/Vocabulary/useCollections'

const learningStatusLabels: Record<LearningStatus, string> = {
  NEW: 'New',
  LEARNING: 'Learning',
  REVIEWING: 'Reviewing',
  MASTERED: 'Mastered',
  IGNORED: 'Ignored',
}

interface VocabularyFilterBarProps {
  params: GetVocabulariesQueryParams
  onFilterChange: (updates: Partial<GetVocabulariesQueryParams>) => void
  onClearFilters: () => void
}

export function VocabularyFilterBar({
  params,
  onFilterChange,
  onClearFilters,
}: VocabularyFilterBarProps) {
  const targetQ = params.q ?? ''
  const [prevQ, setPrevQ] = useState(targetQ)
  const [searchInput, setSearchInput] = useState(targetQ)
  const { data: collectionsData } = useCollectionsQuery({ limit: 100 })
  const collections = collectionsData?.items ?? []

  // Keep local search input synced with external params when params.q changes (e.g. clear filters)
  if (targetQ !== prevQ) {
    setPrevQ(targetQ)
    setSearchInput(targetQ)
  }

  // Debounced search input propagate to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      const currentQ = params.q ?? ''
      if (trimmed !== currentQ) {
        onFilterChange({ q: trimmed || undefined })
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput, params.q, onFilterChange])

  const hasActiveFilters = Boolean(
    params.q ||
      params.learningStatus ||
      params.cefrLevel ||
      params.collectionId ||
      params.dueOnly,
  )

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 3,
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
        >
          <TextField
            placeholder="Search saved word, lemma, note, or meaning…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography color="text.secondary" sx={{ fontSize: 16 }}>
                      🔍
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flexGrow: 1 }}
          />

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="learning-status-label">Status</InputLabel>
              <Select
                labelId="learning-status-label"
                id="learning-status-select"
                value={params.learningStatus ?? ''}
                label="Status"
                onChange={(e) =>
                  onFilterChange({
                    learningStatus:
                      (e.target.value as LearningStatus) || undefined,
                  })
                }
              >
                <MenuItem value="">All Statuses</MenuItem>
                {LEARNING_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {learningStatusLabels[status]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="cefr-level-label">CEFR Level</InputLabel>
              <Select
                labelId="cefr-level-label"
                id="cefr-level-select"
                value={params.cefrLevel ?? ''}
                label="CEFR Level"
                onChange={(e) =>
                  onFilterChange({
                    cefrLevel: (e.target.value as CefrLevel) || undefined,
                  })
                }
              >
                <MenuItem value="">All Levels</MenuItem>
                {CEFR_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="collection-label">Collection</InputLabel>
              <Select
                labelId="collection-label"
                id="collection-select"
                value={params.collectionId ?? ''}
                label="Collection"
                onChange={(e) =>
                  onFilterChange({
                    collectionId: e.target.value || undefined,
                  })
                }
              >
                <MenuItem value="">All Collections</MenuItem>
                {collections.map((col: CollectionListItem) => (
                  <MenuItem key={col.id} value={col.id}>
                    {col.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                id="sort-select"
                value={params.sort}
                label="Sort By"
                onChange={(e) =>
                  onFilterChange({
                    sort: e.target.value as VocabularySort,
                  })
                }
              >
                {VOCABULARY_SORTS.map((sort) => (
                  <MenuItem key={sort} value={sort}>
                    {sort === 'newest' ? 'Newest' : 'Oldest'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(params.dueOnly)}
                onChange={(e) =>
                  onFilterChange({
                    dueOnly: e.target.checked ? true : undefined,
                  })
                }
                color="primary"
              />
            }
            label="Due only"
          />

          {hasActiveFilters ? (
            <Button
              variant="text"
              color="inherit"
              onClick={() => {
                setSearchInput('')
                onClearFilters()
              }}
              sx={{ color: 'text.secondary', fontWeight: 650 }}
            >
              Clear all filters
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}
