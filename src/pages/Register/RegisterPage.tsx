import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  Controller,
  useForm,
  type FieldPath,
  type SubmitHandler,
} from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import { ApiError } from '~/api/client'
import type { CefrLevel, RegisterRequest } from '~/api/types'
import { registerAPI } from '~/apis'
import AuthPageLayout from '~/components/auth/AuthPageLayout'
import { useAppDispatch } from '~/redux/hooks'
import { setCurrentUser } from '~/redux/userSlice'
import {
  getDefaultRouteForRole,
  ROUTE_PATHS,
} from '~/routes/paths'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface RegisterFormValues {
  displayName: string
  email: string
  password: string
  confirmPassword: string
  currentCefrLevel: CefrLevel | ''
  learningGoal: string
}

interface ValidationField {
  field: FieldPath<RegisterFormValues>
  detailKey: string
  message: string
}

const VALIDATION_FIELDS: ValidationField[] = [
  {
    field: 'displayName',
    detailKey: 'displayname',
    message: 'Enter a display name between 1 and 100 characters.',
  },
  {
    field: 'email',
    detailKey: 'email',
    message: 'Enter a valid email address.',
  },
  {
    field: 'password',
    detailKey: 'password',
    message:
      'Use 8–72 characters with uppercase, lowercase, number, and special character.',
  },
  {
    field: 'currentCefrLevel',
    detailKey: 'currentcefrlevel',
    message: 'Select a valid CEFR level.',
  },
  {
    field: 'learningGoal',
    detailKey: 'learninggoal',
    message: 'Learning goal must be 500 characters or fewer.',
  },
]

function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      currentCefrLevel: '',
      learningGoal: '',
    },
  })

  const handleRegistration: SubmitHandler<RegisterFormValues> = async (
    values,
  ) => {
    if (!values.currentCefrLevel) {
      setError('currentCefrLevel', {
        type: 'required',
        message: 'Current CEFR level is required.',
      })
      setFocus('currentCefrLevel')
      return
    }

    setFormError(null)
    const learningGoal = values.learningGoal.trim()
    const request: RegisterRequest = {
      displayName: values.displayName.trim(),
      email: values.email.trim(),
      password: values.password,
      currentCefrLevel: values.currentCefrLevel,
      ...(learningGoal ? { learningGoal } : {}),
    }

    try {
      const session = await registerAPI(request)
      dispatch(setCurrentUser(session.user))
      navigate(getDefaultRouteForRole(session.user.role), {
        replace: true,
      })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 400) {
        const normalizedDetails = (error.details ?? []).map((detail) =>
          detail.toLowerCase(),
        )
        const invalidFields = VALIDATION_FIELDS.filter(({ detailKey }) =>
          normalizedDetails.some((detail) => detail.includes(detailKey)),
        )

        for (const { field, message } of invalidFields) {
          setError(field, { type: 'server', message })
        }

        if (invalidFields.length > 0) {
          setFocus(invalidFields[0].field)
        } else {
          setFormError('Check your details and try again.')
        }
      } else if (error instanceof ApiError && error.status === 409) {
        setError('email', {
          type: 'server',
          message: 'This email is already registered.',
        })
        setFocus('email')
        setFormError(
          'An account already uses this email. Use the sign-in link below.',
        )
      } else if (error instanceof ApiError && error.status === 429) {
        setFormError(
          'Too many registration attempts. Wait a moment, then try again.',
        )
      } else {
        setFormError(
          'We could not create your account. Check your connection and try again.',
        )
      }
    }
  }

  return (
    <AuthPageLayout
      title="Create your account"
      description="Tell us where you are starting so articles can meet you at the right level."
      asideWord="begin"
      asideDefinition="To take the first step in a new activity or experience."
      footer={
        <Typography color="text.secondary" variant="body2">
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to={ROUTE_PATHS.login}
            fontWeight={700}
          >
            Sign in
          </Link>
        </Typography>
      }
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(handleRegistration)}
        sx={{ mt: 4 }}
      >
        <Stack spacing={2.5}>
          {formError ? (
            <Alert severity="error" role="alert">
              {formError}
            </Alert>
          ) : null}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 2.5,
            }}
          >
            <TextField
              id="register-display-name"
              label="Display name"
              autoComplete="name"
              error={Boolean(errors.displayName)}
              helperText={errors.displayName?.message}
              {...register('displayName', {
                required: 'Display name is required.',
                validate: {
                  nonEmpty: (value) =>
                    value.trim().length > 0 ||
                    'Display name cannot contain only spaces.',
                  maxLength: (value) =>
                    value.trim().length <= 100 ||
                    'Display name must be 100 characters or fewer.',
                },
              })}
            />

            <TextField
              id="register-email"
              label="Email"
              type="email"
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              slotProps={{
                htmlInput: {
                  spellCheck: false,
                },
              }}
              {...register('email', {
                required: 'Email is required.',
                validate: {
                  format: (value) =>
                    EMAIL_PATTERN.test(value.trim()) ||
                    'Enter a valid email address.',
                  maxLength: (value) =>
                    value.trim().length <= 320 ||
                    'Email must be 320 characters or fewer.',
                },
              })}
            />

            <TextField
              id="register-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              error={Boolean(errors.password)}
              helperText={
                errors.password?.message ??
                '8–72 characters with uppercase, lowercase, number, and symbol.'
              }
              slotProps={{ htmlInput: { maxLength: 72 } }}
              {...register('password', {
                required: 'Password is required.',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters.',
                },
                maxLength: {
                  value: 72,
                  message: 'Password must be 72 characters or fewer.',
                },
                pattern: {
                  value: PASSWORD_PATTERN,
                  message:
                    'Include uppercase, lowercase, number, and special character.',
                },
              })}
            />

            <TextField
              id="register-confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              slotProps={{ htmlInput: { maxLength: 72 } }}
              {...register('confirmPassword', {
                required: 'Confirm your password.',
                validate: (value, formValues) =>
                  value === formValues.password || 'Passwords do not match.',
              })}
            />

            <Controller
              name="currentCefrLevel"
              control={control}
              rules={{ required: 'Current CEFR level is required.' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="register-cefr-level"
                  select
                  label="Current CEFR level"
                  error={Boolean(errors.currentCefrLevel)}
                  helperText={
                    errors.currentCefrLevel?.message ??
                    'Choose the level that best describes you today.'
                  }
                >
                  {CEFR_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField
              id="register-learning-goal"
              label="Learning goal (optional)"
              autoComplete="off"
              error={Boolean(errors.learningGoal)}
              helperText={
                errors.learningGoal?.message ??
                'For example: Read English news with confidence.'
              }
              {...register('learningGoal', {
                validate: (value) =>
                  value.trim().length <= 500 ||
                  'Learning goal must be 500 characters or fewer.',
              })}
            />
          </Box>

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
                Creating account…
              </>
            ) : (
              'Create account'
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
            {isSubmitting ? 'Creating account…' : ''}
          </Box>
        </Stack>
      </Box>
    </AuthPageLayout>
  )
}

export default RegisterPage
