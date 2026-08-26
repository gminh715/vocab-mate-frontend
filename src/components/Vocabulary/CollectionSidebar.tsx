import { useState } from 'react'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useCollectionsQuery } from '@/hooks/Vocabulary/useCollections'
import { CreateCollectionDialog } from '@/components/Vocabulary/CreateCollectionDialog'

interface CollectionSidebarProps {
  selectedCollectionId?: string
  onSelectCollection: (collectionId: string) => void
}

export function CollectionSidebar({
  selectedCollectionId,
  onSelectCollection,
}: CollectionSidebarProps) {
  const { t } = useTranslation('vocabulary')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { data, isLoading } = useCollectionsQuery({ limit: 100 })
  const collections = data?.items ?? []

  return (
    <>
      <Stack
        spacing={2.25}
        sx={{
          px: { xs: 0, md: 0.5 },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.04em' }}
          >
            {t('sidebar.title', 'Collections')} ({collections.length})
          </Typography>

          <Tooltip title={t('sidebar.createTooltip', 'Create collection')}>
            <IconButton
              color="primary"
              onClick={() => setIsCreateOpen(true)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.dark',
                fontSize: 24,
                '&:hover': { bgcolor: 'primary.main', color: '#FFFFFF' },
              }}
            >
              +
            </IconButton>
          </Tooltip>
        </Stack>

        {isLoading ? (
          <Stack spacing={0.75}>
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} variant="rectangular" height={42} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={0.75}>
            {collections.map((collection) => {
              const isSelected = selectedCollectionId === collection.id

              return (
                <ListItemButton
                  key={collection.id}
                  selected={isSelected}
                  onClick={() => onSelectCollection(collection.id)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    px: 1.5,
                    py: 1.2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      borderColor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.light' },
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: isSelected ? 800 : 600 }}
                    >
                      {collection.name}
                    </Typography>
                    <Chip
                      label={collection.vocabularyCount}
                      size="small"
                      sx={{
                        fontWeight: 750,
                        fontSize: 11,
                        bgcolor: isSelected ? 'primary.main' : 'action.selected',
                        color: isSelected ? '#FFFFFF' : 'text.secondary',
                      }}
                    />
                  </Stack>
                </ListItemButton>
              )
            })}
          </Stack>
        )}
      </Stack>

      <CreateCollectionDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={onSelectCollection}
      />
    </>
  )
}
