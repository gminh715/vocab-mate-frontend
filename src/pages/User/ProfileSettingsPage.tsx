import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { UserAvatar } from '@/components/Shared/UserAvatar'
import { SettingsNavigation } from '@/components/User/SettingsNavigation'
import { normalizeApiError } from '@/config/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateMyProfileMutation } from '@/hooks/User/useProfile'
import {
  profileFormSchema,
  profileToFormValues,
  toUpdateMyProfileRequest,
  validAvatarPreviewUrl,
  type ProfileFormOutput,
  type ProfileFormValues,
} from '@/schemas/User/profile'
import { CEFR_LEVELS } from '@/types/Auth/auth'

const readableAccountValue = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase()

const backendFieldNames = [
  'displayName',
  'avatarUrl',
  'currentCefrLevel',
  'learningGoal',
  'preferredLanguage',
] as const

type ProfileFieldName = (typeof backendFieldNames)[number]

const fieldFromServerMessage = (
  message: string,
): ProfileFieldName | undefined =>
  backendFieldNames.find((field) =>
    message.toLowerCase().includes(field.toLowerCase()),
  )

interface AccountDetailProps {
  label: string
  value: string
}

function AccountDetail({ label, value }: AccountDetailProps) {
  return (
    <Box>
      <Typography
        component="dt"
        color="text.secondary"
        sx={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{
          m: 0,
          mt: 0.75,
          fontWeight: 650,
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

export function ProfileSettingsPage() {
  const { currentUser } = useAuth()
  const updateMutation = useUpdateMyProfileMutation()
  const loadedUserId = useRef<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null,
  )
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: currentUser
      ? profileToFormValues(currentUser.profile)
      : undefined,
  })

  useEffect(() => {
    if (!currentUser || loadedUserId.current === currentUser.id) return
    loadedUserId.current = currentUser.id
    reset(profileToFormValues(currentUser.profile))
  }, [currentUser, reset])

  useEffect(() => {
    if (!isDirty || updateMutation.isPending) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty, updateMutation.isPending])

  const displayName = useWatch({ control, name: 'displayName' })
  const avatarUrl = useWatch({ control, name: 'avatarUrl' })
  const currentCefrLevel = useWatch({
    control,
    name: 'currentCefrLevel',
  })
  const previewUrl = validAvatarPreviewUrl(
    typeof avatarUrl === 'string' ? avatarUrl : '',
  )

  if (!currentUser) return null

  const submit = handleSubmit(async (values) => {
    setSuccessMessage(null)
    updateMutation.reset()

    if (currentUser.profile.avatarUrl && !values.avatarUrl) {
      setError('avatarUrl', {
        type: 'server',
        message:
          'The current API cannot remove an avatar URL. Enter a replacement URL.',
      })
      return
    }

    if (currentUser.profile.learningGoal && !values.learningGoal) {
      setError('learningGoal', {
        type: 'server',
        message:
          'The current API cannot clear a learning goal. Choose a replacement level.',
      })
      return
    }

    const request = toUpdateMyProfileRequest(
      values,
      currentUser.profile,
    )

    if (Object.keys(request).length === 0) {
      reset(profileToFormValues(currentUser.profile))
      return
    }

    try {
      const updated = await updateMutation.mutateAsync(request)
      reset(profileToFormValues(updated.profile))
      setSuccessMessage('Profile changes saved.')
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)
      const messages = apiError.details ?? []
      let focused = false

      for (const message of messages) {
        const field = fieldFromServerMessage(message)
        if (!field) continue
        setError(
          field,
          { type: 'server', message },
          { shouldFocus: !focused },
        )
        focused = true
      }
    }
  })

  const mutationError = updateMutation.error
    ? normalizeApiError(updateMutation.error)
    : null

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <SettingsNavigation />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2.5}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <UserAvatar
          displayName={displayName || currentUser.profile.displayName}
          avatarUrl={previewUrl}
          alt="Avatar preview"
          size={76}
        />
        <Box>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 850,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Your learning identity
          </Typography>
          <Typography
            component="h1"
            variant="h1"
            sx={{ mt: 0.5, fontSize: { xs: 38, md: 50 } }}
          >
            Profile settings
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
            Keep your learning level and profile details up to date.
            Reader highlights follow your current CEFR level.
          </Typography>
        </Box>
      </Stack>

      {successMessage ? (
        <Alert
          severity="success"
          role="status"
          aria-live="polite"
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      ) : null}

      {mutationError ? (
        <Alert severity="error" role="alert">
          {mutationError.details?.[0] ?? mutationError.message}
        </Alert>
      ) : null}

      <Box
        component="form"
        onSubmit={submit}
        noValidate
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            lg: 'minmax(250px, 0.72fr) minmax(0, 1.65fr)',
          },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Stack spacing={3}>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2.5, sm: 3 }, bgcolor: 'background.default' }}
          >
            <Typography variant="h2" sx={{ fontSize: 25 }}>
              Account
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              These details are managed with your account and cannot be
              changed here.
            </Typography>
            <Box
              component="dl"
              sx={{ m: 0, mt: 3, display: 'grid', gap: 2.5 }}
            >
              <AccountDetail label="Email" value={currentUser.email} />
              <AccountDetail
                label="Role"
                value={readableAccountValue(currentUser.role)}
              />
              <AccountDetail
                label="Status"
                value={readableAccountValue(currentUser.status)}
              />
            </Box>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 3 },
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>
              Current learning level
            </Typography>
            <Typography
              aria-live="polite"
              sx={{
                mt: 1,
                fontFamily: 'Georgia, serif',
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {currentCefrLevel}
            </Typography>
            <Typography sx={{ mt: 1.25, opacity: 0.82, fontSize: 14 }}>
              Saving a new level refreshes personalized article
              highlights.
            </Typography>
          </Paper>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: 27 }}>
                Learning profile
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                This information personalizes your prepared learning
                content.
              </Typography>
            </Box>

            <TextField
              label="Display name"
              autoComplete="name"
              error={Boolean(errors.displayName)}
              helperText={errors.displayName?.message}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              {...register('displayName')}
            />

            <TextField
              label="Avatar URL"
              type="url"
              autoComplete="url"
              error={Boolean(errors.avatarUrl)}
              helperText={
                errors.avatarUrl?.message ??
                'Paste a public image URL. File upload is not supported.'
              }
              slotProps={{
                htmlInput: {
                  inputMode: 'url',
                  spellCheck: false,
                },
              }}
              {...register('avatarUrl')}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2.25,
              }}
            >
              <Controller
                control={control}
                name="currentCefrLevel"
                render={({ field }) => (
                  <TextField
                    select
                    label="Current CEFR level"
                    autoComplete="off"
                    error={Boolean(errors.currentCefrLevel)}
                    helperText={
                      errors.currentCefrLevel?.message ??
                      'Reader highlights use this level.'
                    }
                    {...field}
                  >
                    {CEFR_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                control={control}
                name="learningGoal"
                render={({ field }) => (
                  <TextField
                    select
                    label="Learning goal"
                    autoComplete="off"
                    error={Boolean(errors.learningGoal)}
                    helperText={
                      errors.learningGoal?.message ??
                      'Choose a CEFR level above your current level.'
                    }
                    {...field}
                  >
                    <MenuItem value="">Not set</MenuItem>
                    {CEFR_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'flex-end' }}
            >
              {isDirty ? (
                <Chip
                  label="Unsaved changes"
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              ) : null}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <CircularProgress
                      size={18}
                      color="inherit"
                      aria-hidden="true"
                      sx={{ mr: 1 }}
                    />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
