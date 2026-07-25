import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import type { ChipProps } from '@mui/material/Chip'
import type { ArticleStatus } from '../../types/admin-articles'
import type { CefrLevel } from '../../types/auth'

const statusColors: Record<ArticleStatus, ChipProps['color']> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'default',
}

export function ArticleStatusChip({ status }: { status: ArticleStatus }) {
  return (
    <Chip
      label={status[0] + status.slice(1).toLowerCase()}
      color={statusColors[status]}
      variant="outlined"
      size="small"
    />
  )
}

export function ArticleCefrChip({ level }: { level: CefrLevel }) {
  return (
    <Chip
      label={`CEFR ${level}`}
      color="primary"
      variant="outlined"
      size="small"
    />
  )
}

export function ArticleClassification({
  status,
  cefrLevel,
}: {
  status: ArticleStatus
  cefrLevel: CefrLevel
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
      <ArticleStatusChip status={status} />
      <ArticleCefrChip level={cefrLevel} />
    </Stack>
  )
}
