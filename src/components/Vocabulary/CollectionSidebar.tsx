import { useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { CollectionListItem } from '@/types/Vocabulary/vocabulary'
import { useCollectionsQuery } from '@/hooks/Vocabulary/useCollections'
import { CreateCollectionDialog } from '@/components/Vocabulary/CreateCollectionDialog'

interface CollectionSidebarProps {
  selectedCollectionId?: string
  totalVocabularyCount?: number
  onSelectCollection: (collectionId?: string) => void
}

export function CollectionSidebar({
  selectedCollectionId,
  totalVocabularyCount,
  onSelectCollection,
}: CollectionSidebarProps) {
  const { t } = useTranslation('vocabulary')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { data, isLoading } = useCollectionsQuery({ limit: 100 })
  const collections = data?.items ?? []

  const isAllSelected = !selectedCollectionId

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {t('sidebar.title', 'Collections')}
              </Typography>
              <Chip
                label={collections.length}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: 11 }}
              />
            </Box>

            <Tooltip title={t('sidebar.createTooltip', 'Create collection')}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => setIsCreateOpen(true)}
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '&:hover': { bgcolor: 'primary.main', color: '#FFFFFF' },
                }}
              >
                +
              </IconButton>
            </Tooltip>
          </Stack>

        <List disablePadding>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={isAllSelected}
              onClick={() => onSelectCollection(undefined)}
              sx={{
                borderRadius: 2,
                py: 1.2,
                px: 1.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  fontWeight: 700,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: isAllSelected ? 800 : 650 }}>
                    {t('sidebar.allVocabulary', 'All vocabulary')}
                  </Typography>
                }
              />
              {totalVocabularyCount !== undefined ? (
                <Chip
                  label={totalVocabularyCount}
                  size="small"
                  sx={{
                    fontWeight: 750,
                    fontSize: 11,
                    bgcolor: isAllSelected ? 'primary.main' : 'action.selected',
                    color: isAllSelected ? '#FFFFFF' : 'text.secondary',
                  }}
                />
              ) : null}
            </ListItemButton>
          </ListItem>

          {isLoading ? (
            <Stack spacing={1}>
              {[1, 2, 3].map((key) => (
                <Skeleton key={key} variant="rectangular" height={42} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
          ) : (
            collections.map((collection: CollectionListItem) => {
              const isSelected = selectedCollectionId === collection.id

              return (
                <ListItem key={collection.id} disablePadding sx={{ mb: 0.75 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSelectCollection(collection.id)}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        fontWeight: 700,
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 600 }}>
                          {collection.name}
                        </Typography>
                      }
                      secondary={
                        collection.description ? (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 160 }}>
                            {collection.description}
                          </Typography>
                        ) : null
                      }
                    />
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
                  </ListItemButton>
                </ListItem>
              )
            })
          )}
        </List>
      </Stack>
    </Paper>

    <CreateCollectionDialog
      open={isCreateOpen}
      onClose={() => setIsCreateOpen(false)}
      onSuccess={(newId) => onSelectCollection(newId)}
    />
  </>
)
}
