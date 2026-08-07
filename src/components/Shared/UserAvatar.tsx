import Avatar from '@mui/material/Avatar'
import { useState } from 'react'

interface UserAvatarProps {
  displayName: string
  avatarUrl: string | null | undefined
  alt?: string
  size?: number
}

export function UserAvatar({
  displayName,
  avatarUrl,
  alt = '',
  size = 40,
}: UserAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const usableUrl =
    avatarUrl && avatarUrl !== failedUrl ? avatarUrl : undefined
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'

  return (
    <Avatar
      src={usableUrl}
      alt={alt}
      slotProps={{
        img: {
          width: size,
          height: size,
          onError: () => {
            if (avatarUrl) setFailedUrl(avatarUrl)
          },
        },
      }}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        bgcolor: 'primary.light',
        color: 'primary.dark',
        fontFamily: '"Merriweather", serif',
        fontSize: size * 0.42,
        fontWeight: 700,
      }}
    >
      {initial}
    </Avatar>
  )
}
