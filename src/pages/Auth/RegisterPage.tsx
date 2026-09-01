import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { routePaths } from '@/utils/paths'
import { AuthPageLayout } from '@/components/Auth/AuthPageLayout'
import {
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from '@/components/Dashboard/DashboardIcons'
import { useRegisterMutation } from '@/hooks/Auth/useAuth'
import {
  registrationFormSchema,
  toRegisterRequest,
  type RegistrationFormOutput,
  type RegistrationFormValues,
} from '@/schemas/Auth/auth'

export function RegisterPage() {
  const { t, i18n } = useTranslation('auth')
  const registerMutation = useRegisterMutation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en'

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<
    RegistrationFormValues,
    unknown,
    RegistrationFormOutput
  >({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferredLanguage: currentLang,
    },
  })

  const passwordValue = useWatch({ control, name: 'password' }) || ''

  const passwordRules = [
    {
      id: 'length',
      label: t('register.requirements.length'),
      valid: passwordValue.length >= 8 && passwordValue.length <= 72,
    },
    {
      id: 'lowercase',
      label: t('register.requirements.lowercase'),
      valid: /[a-z]/.test(passwordValue),
    },
    {
      id: 'uppercase',
      label: t('register.requirements.uppercase'),
      valid: /[A-Z]/.test(passwordValue),
    },
    {
      id: 'number',
      label: t('register.requirements.number'),
      valid: /\d/.test(passwordValue),
    },
    {
      id: 'special',
      label: t('register.requirements.special'),
      valid: /[^A-Za-z0-9]/.test(passwordValue),
    },
  ]

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toRegisterRequest({
        ...values,
        preferredLanguage: currentLang,
      })
      await registerMutation.mutateAsync(payload)
      navigate(routePaths.login, { replace: true })
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)

      if (apiError.status === 409) {
        setError(
          'email',
          {
            type: 'server',
            message: t('register.errors.emailExists'),
          },
          { shouldFocus: true },
        )
      }
    }
  })

  const registerError = registerMutation.error
    ? normalizeApiError(registerMutation.error)
    : null
  const formLevelError =
    registerError && registerError.status !== 409
      ? registerError.details?.[0] ?? registerError.message
      : null

  return (
    <AuthPageLayout
      title={t('register.title')}
      description={t('register.subtitle')}
      alternatePrompt={t('register.alternatePrompt')}
      alternateAction={t('register.alternateAction')}
      alternateHref={routePaths.login}
    >
      {formLevelError ? (
        <Alert severity="error" role="alert" sx={{ borderRadius: 2.5 }}>
          {formLevelError}
        </Alert>
      ) : null}

      <Stack component="form" spacing={2.25} onSubmit={onSubmit} noValidate>
        <TextField
          id="register-display-name"
          label={t('register.displayNameLabel')}
          placeholder={t('register.displayNamePlaceholder')}
          autoComplete="name"
          fullWidth
          error={Boolean(errors.displayName)}
          helperText={errors.displayName?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                    <UserIcon size={19} />
                  </Box>
                </InputAdornment>
              ),
            },
          }}
          {...register('displayName')}
        />

        <TextField
          id="register-email"
          label={t('register.emailLabel')}
          placeholder={t('register.emailPlaceholder')}
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

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField
            id="register-password"
            label={t('register.passwordLabel')}
            placeholder={t('register.passwordPlaceholder')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

          <TextField
            id="register-confirm-password"
            label={t('register.confirmPasswordLabel')}
            placeholder={t('register.confirmPasswordPlaceholder')}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
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
                        showConfirmPassword
                          ? t('common.hidePassword')
                          : t('common.showPassword')
                      }
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon size={19} />
                      ) : (
                        <EyeIcon size={19} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('confirmPassword')}
          />
        </Box>

        {/* Live Password Criteria Checklist */}
        <Box
          sx={{
            p: 1.75,
            borderRadius: 2.5,
            bgcolor: 'rgba(23, 107, 75, 0.04)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
            }}
          >
            {t('register.requirements.title')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 0.75,
            }}
          >
            {passwordRules.map((rule) => (
              <Stack
                key={rule.id}
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center' }}
              >
                <Box
                  sx={{
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: rule.valid ? 'success.main' : 'transparent',
                    border: '1.5px solid',
                    borderColor: rule.valid ? 'success.main' : 'text.disabled',
                    color: '#FFFFFF',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  {rule.valid ? <CheckCircleIcon size={11} color="#FFFFFF" /> : null}
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: rule.valid ? 'success.dark' : 'text.secondary',
                    fontWeight: rule.valid ? 600 : 400,
                    transition: 'color 0.2s ease',
                  }}
                >
                  {rule.label}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={registerMutation.isPending}
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
          {registerMutation.isPending ? (
            <>
              <CircularProgress
                size={18}
                color="inherit"
                aria-hidden="true"
                sx={{ mr: 1.25 }}
              />
              {t('register.submitting')}
            </>
          ) : (
            t('register.submit')
          )}
        </Button>
      </Stack>
    </AuthPageLayout>
  )
}
