import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { ApiError } from '~/api/client'
import type { LoginRequest } from '~/api/types'
import { loginAPI } from '~/apis'
import AuthPageLayout from '~/components/auth/AuthPageLayout'
import { useAppDispatch } from '~/redux/hooks'
import { setCurrentUser } from '~/redux/userSlice'
import { getSafeReturnPath } from '~/routes/navigation'
import {
  getDefaultRouteForRole,
  ROUTE_PATHS,
} from '~/routes/paths'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPage() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleLogin: SubmitHandler<LoginRequest> = async (values) => {
    setFormError(null)

    try {
      const session = await loginAPI({
        email: values.email.trim(),
        password: values.password,
      })

      dispatch(setCurrentUser(session.user))
      const requestedPath = getSafeReturnPath(location.state)
      navigate(requestedPath ?? getDefaultRouteForRole(session.user.role), {
        replace: true,
      })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 400) {
        const details = error.details ?? []
        let hasFieldError = false

        if (details.some((detail) => detail.toLowerCase().includes('email'))) {
          setError('email', {
            type: 'server',
            message: 'Enter a valid email address.',
          })
          hasFieldError = true
        }
        if (
          details.some((detail) => detail.toLowerCase().includes('password'))
        ) {
          setError('password', {
            type: 'server',
            message: 'Enter a password between 1 and 72 characters.',
          })
          hasFieldError = true
        }

        if (!hasFieldError) {
          setFormError('Check your details and try again.')
        } else if (
          details.some((detail) => detail.toLowerCase().includes('email'))
        ) {
          setFocus('email')
        } else {
          setFocus('password')
        }
      } else if (error instanceof ApiError && error.status === 401) {
        setFormError('The email or password is incorrect. Try again.')
      } else if (error instanceof ApiError && error.status === 403) {
        setFormError(
          'This account is unavailable. Contact an administrator for help.',
        )
      } else if (error instanceof ApiError && error.status === 429) {
        setFormError(
          'Too many sign-in attempts. Wait a moment, then try again.',
        )
      } else {
        setFormError(
          'We could not sign you in. Check your connection and try again.',
        )
      }
    }
  }

  return (
    <AuthPageLayout
      title="Welcome back"
      description="Sign in to continue reading and building your vocabulary."
      asideWord="return"
      asideDefinition="To come back to a place, activity, or way of learning."
      footer={
        <Typography color="text.secondary" variant="body2">
          New to Vocab Mate?{' '}
          <Link
            component={RouterLink}
            to={ROUTE_PATHS.register}
            fontWeight={700}
          >
            Create an account
          </Link>
        </Typography>
      }
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(handleLogin)}
        sx={{ mt: 4 }}
      >
        <Stack spacing={2.5}>
          {formError ? (
            <Alert severity="error" role="alert">
              {formError}
            </Alert>
          ) : null}

          <TextField
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            slotProps={{
              htmlInput: {
                spellCheck: false,
                maxLength: 320,
              },
            }}
            {...register('email', {
              required: 'Email is required.',
              pattern: {
                value: EMAIL_PATTERN,
                message: 'Enter a valid email address.',
              },
              maxLength: {
                value: 320,
                message: 'Email must be 320 characters or fewer.',
              },
            })}
          />

          <TextField
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            slotProps={{
              htmlInput: {
                maxLength: 72,
              },
            }}
            {...register('password', {
              required: 'Password is required.',
              maxLength: {
                value: 72,
                message: 'Password must be 72 characters or fewer.',
              },
            })}
          />

          <Button
            type="submit"
            variant="contained"
            color="success"
            size="large"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            sx={{ minHeight: 48, fontWeight: 750 }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress
                  aria-hidden="true"
                  color="inherit"
                  size={20}
                  sx={{ mr: 1.25 }}
                />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          <Box
            role="status"
            aria-live="polite"
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {isSubmitting ? 'Signing in…' : ''}
          </Box>
        </Stack>
      </Box>
    </AuthPageLayout>
  )
}

export default LoginPage
