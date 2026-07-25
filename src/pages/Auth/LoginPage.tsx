import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../../config/apiClient'
import { postAuthPath, routePaths } from '../../utils/paths'
import { AuthPageLayout } from '../../components/Auth/AuthPageLayout'
import { useLoginMutation } from '../../hooks/useAuth'
import {
  loginSchema,
  type LoginFormValues,
  type LoginRequest,
} from '../../schemas/auth'

const loginErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)

  if (apiError.status === 401) {
    return 'Email or password is incorrect. Check your details and try again.'
  }

  if (apiError.status === 403) {
    return 'This account is suspended or disabled. Contact an administrator for help.'
  }

  return apiError.status === 0
    ? apiError.message
    : 'Sign in could not be completed. Try again.'
}

export function LoginPage() {
  const loginMutation = useLoginMutation()
  const location = useLocation()
  const navigate = useNavigate()
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
      navigate(postAuthPath(currentUser.role, location.state), {
        replace: true,
      })
    } catch {
      // The mutation error is rendered in the form alert.
    }
  })

  return (
    <AuthPageLayout
      title="Welcome Back"
      description="Sign in to continue building your vocabulary through real articles."
      alternatePrompt="New to Vocab Mate?"
      alternateAction="Create an account"
      alternateHref={routePaths.register}
    >
      {loginMutation.error ? (
        <Alert severity="error" role="alert">
          {loginErrorMessage(loginMutation.error)}
        </Alert>
      ) : null}

      <Stack component="form" spacing={2.25} onSubmit={onSubmit} noValidate>
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          slotProps={{ htmlInput: { spellCheck: false } }}
          {...register('email')}
        />
        <TextField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register('password')}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <CircularProgress
                size={18}
                color="inherit"
                aria-hidden="true"
                sx={{ mr: 1 }}
              />
              Signing In…
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </Stack>
    </AuthPageLayout>
  )
}
