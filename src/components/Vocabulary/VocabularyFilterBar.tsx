import { useEffect, useRef, useState } from 'react'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import {
  LEARNING_STATUSES,
  VOCABULARY_SORTS,
  type GetVocabulariesQueryParams,
  type LearningStatus,
  type VocabularySort,
} from '@/types/Vocabulary/vocabulary'

interface VocabularyFilterBarProps {
  params: GetVocabulariesQueryParams
  onFilterChange: (updates: Partial<GetVocabulariesQueryParams>) => void
  onClearFilters: () => void
  selectedCount?: number
  isBulkDeleting?: boolean
  onBulkDelete?: () => void
}

export function VocabularyFilterBar({
  params,
  onFilterChange,
  onClearFilters,
  selectedCount = 0,
  isBulkDeleting = false,
  onBulkDelete,
}: VocabularyFilterBarProps) {
  const { t } = useTranslation('vocabulary')
  const targetQ = params.q ?? ''
  const [prevQ, setPrevQ] = useState(targetQ)
  const [searchInput, setSearchInput] = useState(targetQ)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)

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

  const activeFilterCount = [
    params.learningStatus,
  ].filter(Boolean).length

  const hasActiveFilters = Boolean(
    params.q ||
      params.learningStatus,
  )

  const open = Boolean(anchorEl)

  const handleOpenFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseFilters = () => {
    setAnchorEl(null)
  }

  const handleClearAll = () => {
    setSearchInput('')
    onClearFilters()
    handleCloseFilters()
  }

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', width: '100%' }}
      >
        <TextField
          size="small"
          placeholder={t('filterBar.searchPlaceholder')}
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
          sx={{ flexGrow: 1, minWidth: 0 }}
        />

        <Badge
          badgeContent={activeFilterCount}
          color="primary"
          overlap="circular"
        >
          <Button
            ref={filterButtonRef}
            id="vocabulary-filter-button"
            aria-controls={open ? 'vocabulary-filter-popover' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
            size="small"
            onClick={handleOpenFilters}
            sx={{ whiteSpace: 'nowrap', minWidth: 80 }}
          >
            {t('filterBar.filtersButton')}
          </Button>
        </Badge>

        {selectedCount > 0 && onBulkDelete ? (
          <Badge badgeContent={selectedCount} color="error" overlap="circular">
            <Button
              color="error"
              variant="contained"
              size="small"
              disabled={isBulkDeleting}
              onClick={() => setBulkDeleteDialogOpen(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('table.bulk.deleteSelected')}
            </Button>
          </Badge>
        ) : null}

        {hasActiveFilters ? (
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={handleClearAll}
            sx={{ color: 'text.secondary', fontWeight: 650, whiteSpace: 'nowrap' }}
          >
            {t('filterBar.clearAll')}
          </Button>
        ) : null}
      </Stack>

      <Popover
        id="vocabulary-filter-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              p: 2.5,
              width: 300,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('filterBar.popoverTitle')}
          </Typography>

          <FormControl size="small" fullWidth>
            <InputLabel id="learning-status-label">{t('filterBar.status')}</InputLabel>
            <Select
              labelId="learning-status-label"
              id="learning-status-select"
              value={params.learningStatus ?? ''}
              label={t('filterBar.status')}
              onChange={(e) =>
                onFilterChange({
                  learningStatus:
                    (e.target.value as LearningStatus) || undefined,
                })
              }
            >
              <MenuItem value="">{t('filterBar.allStatuses')}</MenuItem>
              {LEARNING_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`statusLabels.${status}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="sort-label">{t('filterBar.sortBy')}</InputLabel>
            <Select
              labelId="sort-label"
              id="sort-select"
              value={params.sort}
              label={t('filterBar.sortBy')}
              onChange={(e) =>
                onFilterChange({
                  sort: e.target.value as VocabularySort,
                })
              }
            >
              {VOCABULARY_SORTS.map((sort) => (
                <MenuItem key={sort} value={sort}>
                  {sort === 'newest' ? t('filterBar.sortNewest') : t('filterBar.sortOldest')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        </Stack>
      </Popover>

      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        aria-labelledby="bulk-delete-dialog-title"
      >
        <DialogTitle id="bulk-delete-dialog-title">
          {t('table.bulk.dialog.title', { count: selectedCount })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('table.bulk.dialog.description', { count: selectedCount })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>
            {t('table.dialog.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isBulkDeleting}
            onClick={() => {
              onBulkDelete?.()
              setBulkDeleteDialogOpen(false)
            }}
          >
            {t('table.bulk.dialog.confirm', { count: selectedCount })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
