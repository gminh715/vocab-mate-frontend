import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

interface ArticleCoverProps {
  categoryName: string
  priority?: boolean
  thumbnailUrl: string | null
}

export function ArticleCover({
  categoryName,
  priority = false,
  thumbnailUrl,
}: ArticleCoverProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        bgcolor: 'primary.light',
      }}
    >
      {thumbnailUrl ? (
        <Box
          component="img"
          src={thumbnailUrl}
          alt=""
          width={800}
          height={450}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          sx={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          aria-hidden="true"
          sx={{
            display: 'grid',
            height: '100%',
            placeItems: 'center',
            background:
              'linear-gradient(135deg, #DDF3E8 0%, #F3F7F4 55%, #F8E4D1 100%)',
          }}
        >
          <Typography
            sx={{
              color: 'primary.dark',
              fontFamily: 'Georgia, serif',
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            {categoryName.charAt(0).toUpperCase()}
          </Typography>
        </Box>
      )}

      <Chip
        label={categoryName}
        size="small"
        sx={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          maxWidth: 'calc(100% - 24px)',
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          fontWeight: 700,
        }}
      />
    </Box>
  )
}
