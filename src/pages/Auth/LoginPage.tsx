import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { postLoginPath, routePaths } from '@/utils/paths'
import { AuthPageLayout } from '@/components/Auth/AuthPageLayout'
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from '@/components/Dashboard/DashboardIcons'
import {
  authQueryKeys,
  useLoginMutation,
  type AuthSessionNotice,
} from '@/hooks/Auth/useAuth'
import {
  loginSchema,
  type LoginFormValues,
  type LoginRequest,
} from '@/schemas/Auth/auth'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const loginMutation = useLoginMutation()
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const [sessionNotice] = useState<AuthSessionNotice | undefined>(() =>
    queryClient.getQueryData<AuthSessionNotice>(
      authQueryKeys.sessionNotice(),
    ),
  )
  const passwordChanged = sessionNotice === 'PASSWORD_CHANGED'
  const registered = sessionNotice === 'REGISTERED'

  useEffect(() => {
    if (!sessionNotice) return
    queryClient.removeQueries({
      queryKey: authQueryKeys.sessionNotice(),
      exact: true,
    })
  }, [queryClient, sessionNotice])

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues, unknown, LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const currentUser = await loginMutation.mutateAsync(values)
      navigate(postLoginPath(currentUser, location.state), {
        replace: true,
      })
    } catch {
      // The mutation error is rendered in the form alert.
    }
  })

  const getLoginErrorMessage = (error: unknown): string => {
    const apiError = normalizeApiError(error)

    if (apiError.status === 401) {
      return t('login.errors.unauthorized')
    }

    if (apiError.status === 403) {
      return t('login.errors.forbidden')
    }

    return apiError.status === 0
      ? apiError.message
      : t('login.errors.generic')
  }

  return (
    <AuthPageLayout
      title={t('login.title')}
      description={t('login.subtitle')}
      alternatePrompt={t('login.alternatePrompt')}
      alternateAction={t('login.alternateAction')}
      alternateHref={routePaths.register}
    >
      {passwordChanged ? (
        <Alert
          severity="success"
          role="status"
          aria-live="polite"
          sx={{ borderRadius: 2.5 }}
        >
          {t('login.notices.passwordChanged')}
        </Alert>
      ) : null}

      {registered ? (
        <Alert
          severity="success"
          role="status"
          aria-live="polite"
          sx={{ borderRadius: 2.5 }}
        >
          {t('login.notices.registered')}
        </Alert>
      ) : null}

      {loginMutation.error ? (
        <Alert severity="error" role="alert" sx={{ borderRadius: 2.5 }}>
          {getLoginErrorMessage(loginMutation.error)}
        </Alert>
      ) : null}

      <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
        <Box>
          <TextField
            id="login-email"
            label={t('login.emailLabel')}
            placeholder={t('login.emailPlaceholder')}
            type="email"
            autoComplete="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            slotProps={{
              htmlInput: { spellCheck: false },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                      <MailIcon size={19} />
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
            {...register('email')}
          />
        </Box>

        <Box>
          <TextField
            id="login-password"
            label={t('login.passwordLabel')}
            placeholder={t('login.passwordPlaceholder')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                      <LockIcon size={19} />
                    </Box>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword
                          ? t('common.hidePassword')
                          : t('common.showPassword')
                      }
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? (
                        <EyeOffIcon size={19} />
                      ) : (
                        <EyeIcon size={19} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('password')}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loginMutation.isPending}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 750,
            borderRadius: 3,
            boxShadow: '0 8px 24px -4px rgba(23, 107, 75, 0.4)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 12px 28px -4px rgba(23, 107, 75, 0.5)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          {loginMutation.isPending ? (
            <>
              <CircularProgress
                size={18}
                color="inherit"
                aria-hidden="true"
                sx={{ mr: 1.25 }}
              />
              {t('login.submitting')}
            </>
          ) : (
            t('login.submit')
          )}
        </Button>
      </Stack>
    </AuthPageLayout>
  )
}
