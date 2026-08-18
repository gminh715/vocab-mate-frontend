import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { routePaths } from '@/utils/paths'
import { AuthPageLayout } from '@/components/Auth/AuthPageLayout'
import { useRegisterMutation } from '@/hooks/Auth/useAuth'
import {
  registrationFormSchema,
  toRegisterRequest,
  type RegistrationFormOutput,
  type RegistrationFormValues,
} from '@/schemas/Auth/auth'

export function RegisterPage() {
  const registerMutation = useRegisterMutation()
  const navigate = useNavigate()
  const {
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
      preferredLanguage: 'vi',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(toRegisterRequest(values))
      navigate(routePaths.login, { replace: true })
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)

      if (apiError.status === 409) {
        setError(
          'email',
          {
            type: 'server',
            message: 'An account with this email already exists.',
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
      title="Create Your Account"
      description="Create your account first. After signing in, a short placement test will personalize your learning plan."
      alternatePrompt="Already have an account?"
      alternateAction="Sign in"
      alternateHref={routePaths.login}
    >
      {formLevelError ? (
        <Alert severity="error" role="alert">
          {formLevelError}
        </Alert>
      ) : null}

      <Stack component="form" spacing={2.25} onSubmit={onSubmit} noValidate>
        <TextField
          id="register-display-name"
          label="Display Name"
          autoComplete="name"
          error={Boolean(errors.displayName)}
          helperText={errors.displayName?.message}
          {...register('displayName')}
        />
        <TextField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          slotProps={{ htmlInput: { spellCheck: false } }}
          {...register('email')}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.25,
          }}
        >
          <TextField
            id="register-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={Boolean(errors.password)}
            helperText={
              errors.password?.message ??
              '8–72 characters with upper, lower, number, and symbol.'
            }
            {...register('password')}
          />
          <TextField
            id="register-confirm-password"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <CircularProgress
                size={18}
                color="inherit"
                aria-hidden="true"
                sx={{ mr: 1 }}
              />
              Creating Account…
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </Stack>
    </AuthPageLayout>
  )
}
