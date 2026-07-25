import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../../config/apiClient'
import { postAuthPath, routePaths } from '../../utils/paths'
import { AuthPageLayout } from '../../components/Auth/AuthPageLayout'
import { useRegisterMutation } from '../../hooks/useAuth'
import {
  registrationFormSchema,
  toRegisterRequest,
  type RegistrationFormOutput,
  type RegistrationFormValues,
} from '../../schemas/auth'
import { CEFR_LEVELS } from '../../types/auth'

export function RegisterPage() {
  const registerMutation = useRegisterMutation()
  const location = useLocation()
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
      currentCefrLevel: 'B1',
      learningGoal: '',
      preferredLanguage: 'vi',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const currentUser = await registerMutation.mutateAsync(
        toRegisterRequest(values),
      )
      navigate(postAuthPath(currentUser.role, location.state), {
        replace: true,
      })
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
      description="Tell us where you are starting so Vocab Mate can show the prepared learning content that fits you."
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

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.25,
          }}
        >
          <TextField
            id="register-cefr"
            label="Current CEFR Level"
            select
            defaultValue="B1"
            error={Boolean(errors.currentCefrLevel)}
            helperText={
              errors.currentCefrLevel?.message ??
              'Choose your current English level.'
            }
            {...register('currentCefrLevel')}
          >
            {CEFR_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            id="register-language"
            label="Preferred Language"
            autoComplete="language"
            error={Boolean(errors.preferredLanguage)}
            helperText={
              errors.preferredLanguage?.message ??
              'Use a language code such as vi or en.'
            }
            {...register('preferredLanguage')}
          />
        </Box>

        <TextField
          id="register-learning-goal"
          label="Learning Goal (Optional)"
          autoComplete="off"
          multiline
          minRows={2}
          error={Boolean(errors.learningGoal)}
          helperText={errors.learningGoal?.message}
          placeholder="e.g. Learn 10 useful words each day…"
          {...register('learningGoal')}
        />

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
