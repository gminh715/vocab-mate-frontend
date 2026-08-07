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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('profile')
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
        message: t('profile.cannotRemoveAvatar'),
      })
      return
    }

    if (currentUser.profile.learningGoal && !values.learningGoal) {
      setError('learningGoal', {
        type: 'server',
        message: t('profile.cannotClearGoal'),
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
      setSuccessMessage(t('profile.successMessage'))
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 3, md: 4 },
        alignItems: 'flex-start',
      }}
    >
      <SettingsNavigation />
      <Stack spacing={{ xs: 3, md: 4 }} sx={{ flexGrow: 1, width: '100%', minWidth: 0 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <UserAvatar
            displayName={displayName || currentUser.profile.displayName}
            avatarUrl={previewUrl}
            alt={t('profile.avatarAlt')}
            size={76}
          />
          <Box>
            <Typography
              component="h1"
              variant="h1"
              sx={{ fontSize: { xs: 38, md: 50 } }}
            >
              {t('profile.title', 'Profile settings')}
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
              <Box
                component="dl"
                sx={{ m: 0, mt: 3, display: 'grid', gap: 2.5 }}
              >
                <AccountDetail label={t('profile.account.email')} value={currentUser.email} />
                <AccountDetail
                  label={t('profile.account.role')}
                  value={readableAccountValue(currentUser.role)}
                />
                <AccountDetail
                  label={t('profile.account.status')}
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
              <Typography
                aria-live="polite"
                sx={{
                  mt: 1,
                  fontFamily: '"Merriweather", serif',
                  fontSize: 44,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {currentCefrLevel}
              </Typography>
              <Typography sx={{ mt: 1.25, opacity: 0.82, fontSize: 14 }}>
                {t('profile.cefrCard.hint')}
              </Typography>
            </Paper>
          </Stack>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={3}>
              <TextField
                label={t('profile.form.displayName')}
                autoComplete="name"
                error={Boolean(errors.displayName)}
                helperText={errors.displayName?.message}
                slotProps={{ htmlInput: { maxLength: 100 } }}
                {...register('displayName')}
              />

              <TextField
                label={t('profile.form.avatarUrl')}
                type="url"
                autoComplete="url"
                error={Boolean(errors.avatarUrl)}
                helperText={
                  errors.avatarUrl?.message ??
                  t('profile.form.avatarUrlHint')
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
                      label={t('profile.form.cefrLevel')}
                      autoComplete="off"
                      error={Boolean(errors.currentCefrLevel)}
                      helperText={
                        errors.currentCefrLevel?.message ??
                        t('profile.form.cefrLevelHint')
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
                      label={t('profile.form.learningGoal')}
                      autoComplete="off"
                      error={Boolean(errors.learningGoal)}
                      helperText={
                        errors.learningGoal?.message ??
                        t('profile.form.learningGoalHint')
                      }
                      {...field}
                    >
                      <MenuItem value="">{t('profile.form.learningGoalNotSet')}</MenuItem>
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
                    label={t('profile.form.unsavedChanges')}
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
                      {t('profile.form.saving')}
                    </>
                  ) : (
                    t('profile.form.saveChanges')
                  )}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Box>
  )
}
