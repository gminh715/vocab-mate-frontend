import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Fade from '@mui/material/Fade'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { SettingsNavigation } from '@/components/User/SettingsNavigation'
import { normalizeApiError } from '@/config/apiClient'
import {
  useChangePasswordMutation,
  useClearAuthSession,
} from '@/hooks/Auth/useAuth'
import {
  changePasswordFormSchema,
  toChangePasswordRequest,
  type ChangePasswordFormOutput,
  type ChangePasswordFormValues,
} from '@/schemas/Auth/changePassword'

interface PasswordVisibilityButtonProps {
  fieldLabel: string
  visible: boolean
  onToggle: () => void
  showLabel: string
  hideLabel: string
}

function PasswordVisibilityButton({
  fieldLabel,
  visible,
  onToggle,
  showLabel,
  hideLabel,
}: PasswordVisibilityButtonProps) {
  const action = visible ? hideLabel : showLabel

  return (
    <Button
      type="button"
      color="inherit"
      size="small"
      aria-label={`${action} ${fieldLabel.toLowerCase()}`}
      aria-pressed={visible}
      onClick={onToggle}
      onMouseDown={(event) => event.preventDefault()}
      sx={{ minWidth: 54, minHeight: 36, mr: -0.75 }}
    >
      {action}
    </Button>
  )
}

const safePasswordError = (error: unknown, serverMsg: string, genericMsg: string): string | null => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 0) return apiError.message
  if (apiError.status >= 500) {
    return serverMsg
  }
  if (apiError.status !== 400 && apiError.status !== 401) {
    return genericMsg
  }
  return null
}

export function SecuritySettingsPage() {
  const { t } = useTranslation('profile')
  const changePasswordMutation = useChangePasswordMutation()
  const clearSession = useClearAuthSession()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<
    ChangePasswordFormValues,
    unknown,
    ChangePasswordFormOutput
  >({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    changePasswordMutation.reset()

    try {
      await changePasswordMutation.mutateAsync(
        toChangePasswordRequest(values),
      )
      clearSession('PASSWORD_CHANGED')
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)
      const safeFormError = safePasswordError(
        error,
        t(
          'security.errors.serverError',
          'Password could not be changed right now. Try again.',
        ),
        t(
          'security.errors.genericError',
          'Password could not be changed. Try again.',
        ),
      )
      changePasswordMutation.reset()

      if (apiError.status === 401) {
        setError(
          'currentPassword',
          {
            type: 'server',
            message: t(
              'security.form.currentPasswordIncorrect',
              'Current password is incorrect. Check it and try again.',
            ),
          },
          { shouldFocus: true },
        )
        return
      }

      if (apiError.status === 400) {
        const feedback =
          apiError.details?.find((detail) =>
            detail.toLowerCase().includes('newpassword'),
          ) ??
          apiError.details?.[0] ??
          apiError.message
        setError(
          'newPassword',
          { type: 'server', message: feedback },
          { shouldFocus: true },
        )
        return
      }

      setFormError(safeFormError)
    }
  })

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        alignItems: 'stretch',
      }}
    >
      <SettingsNavigation />
      <Fade in timeout={300}>
        <Stack
          spacing={{ xs: 3, md: 4 }}
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 760,
            mx: 'auto',
            minWidth: 0,
            animation: 'settingsFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            '@keyframes settingsFadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(8px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Box>
            <Typography
              component="h1"
              variant="h1"
              sx={{
                fontSize: { xs: 38, md: 50 },
                textWrap: 'balance',
              }}
            >
              {t('security.title', 'Account security')}
            </Typography>
          </Box>

          <Box
            sx={{
              width: '100%',
            }}
          >
            <Paper
              component="form"
              variant="outlined"
              onSubmit={submit}
              noValidate
              sx={{ p: { xs: 2.5, sm: 3.5 } }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="h2" sx={{ fontSize: 27 }}>
                    {t('security.form.title', 'Change password')}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    {t('security.form.subtitle', 'All fields are required.')}
                  </Typography>
                </Box>

                {formError ? (
                  <Alert severity="error" role="alert">
                    {formError}
                  </Alert>
                ) : null}

                <TextField
                  label={t('security.form.currentPassword', 'Current password')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  error={Boolean(errors.currentPassword)}
                  helperText={errors.currentPassword?.message}
                  slotProps={{
                    htmlInput: { maxLength: 72 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <PasswordVisibilityButton
                            fieldLabel={t(
                              'security.form.currentPassword',
                              'Current password',
                            )}
                            visible={showCurrentPassword}
                            showLabel={t('security.visibility.show', 'Show')}
                            hideLabel={t('security.visibility.hide', 'Hide')}
                            onToggle={() =>
                              setShowCurrentPassword((current) => !current)
                            }
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  {...register('currentPassword')}
                />

                <TextField
                  label={t('security.form.newPassword', 'New password')}
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={Boolean(errors.newPassword)}
                  helperText={
                    errors.newPassword?.message ??
                    t(
                      'security.form.newPasswordHint',
                      '8–72 characters with uppercase, lowercase, number, and special character.',
                    )
                  }
                  slotProps={{
                    htmlInput: { maxLength: 72 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <PasswordVisibilityButton
                            fieldLabel={t(
                              'security.form.newPassword',
                              'New password',
                            )}
                            visible={showNewPassword}
                            showLabel={t('security.visibility.show', 'Show')}
                            hideLabel={t('security.visibility.hide', 'Hide')}
                            onToggle={() =>
                              setShowNewPassword((current) => !current)
                            }
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  {...register('newPassword')}
                />

                <TextField
                  label={t(
                    'security.form.confirmNewPassword',
                    'Confirm new password',
                  )}
                  type={showConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={Boolean(errors.confirmNewPassword)}
                  helperText={errors.confirmNewPassword?.message}
                  slotProps={{
                    htmlInput: { maxLength: 72 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <PasswordVisibilityButton
                            fieldLabel={t(
                              'security.form.confirmNewPassword',
                              'Confirm new password',
                            )}
                            visible={showConfirmation}
                            showLabel={t('security.visibility.show', 'Show')}
                            hideLabel={t('security.visibility.hide', 'Hide')}
                            onToggle={() =>
                              setShowConfirmation((current) => !current)
                            }
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  {...register('confirmNewPassword')}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={changePasswordMutation.isPending}
                  sx={{ alignSelf: { sm: 'flex-end' } }}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <CircularProgress
                        size={18}
                        color="inherit"
                        aria-hidden="true"
                        sx={{ mr: 1 }}
                      />
                      {t('security.form.changing', 'Changing password…')}
                    </>
                  ) : (
                    t('security.form.submit', 'Change password')
                  )}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Fade>
    </Box>
  )
}
