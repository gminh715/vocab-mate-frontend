import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import {
  Link as RouterLink,
  useParams,
} from 'react-router-dom'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import { LoadingState } from '@/components/Shared/LoadingState'
import { normalizeApiError } from '@/config/apiClient'
import {
  useAdminUserDetailQuery,
  useUpdateAdminUserRoleMutation,
  useUpdateAdminUserStatusMutation,
} from '@/hooks/Admin/useAdminUsers'
import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from '@/types/Auth/auth'
import { routePaths } from '@/utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
  timeStyle: 'short',
})

const formatDate = (value: string | null): string =>
  value ? dateFormatter.format(new Date(value)) : 'Never'

const readableLabel = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase()

const mutationErrorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

interface DetailFieldProps {
  label: string
  value: string
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <Box>
      <Typography
        component="dt"
        color="text.secondary"
        sx={{ fontSize: 13, fontWeight: 700 }}
      >
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  )
}

interface StatusControlProps {
  userId: string
  currentStatus: UserStatus
  onSuccess: (message: string) => void
}

function StatusControl({
  userId,
  currentStatus,
  onSuccess,
}: StatusControlProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<UserStatus>(currentStatus)
  const [isConfirming, setIsConfirming] = useState(false)
  const mutation = useUpdateAdminUserStatusMutation(userId)

  const openConfirmation = () => {
    mutation.reset()
    setIsConfirming(true)
  }

  const confirmChange = () => {
    mutation.mutate(selectedStatus, {
      onSuccess: () => {
        setIsConfirming(false)
        onSuccess(`Status changed to ${readableLabel(selectedStatus)}.`)
      },
    })
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h2" sx={{ fontSize: 23 }}>
        Account status
      </Typography>
      <Typography color="text.secondary">
        Status controls whether this account can use the application.
      </Typography>
      <TextField
        select
        label="Status"
        value={selectedStatus}
        onChange={(event) => {
          const nextStatus = USER_STATUSES.find(
            (status) => status === event.target.value,
          )
          if (nextStatus) setSelectedStatus(nextStatus)
        }}
      >
        {USER_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {readableLabel(status)}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        disabled={selectedStatus === currentStatus}
        onClick={openConfirmation}
        sx={{ alignSelf: 'flex-start' }}
      >
        Change status
      </Button>
      <ConfirmationDialog
        open={isConfirming}
        title="Confirm status change"
        description={`Change this account’s status from ${readableLabel(currentStatus)} to ${readableLabel(selectedStatus)}? Access may change immediately.`}
        confirmLabel="Change status"
        isPending={mutation.isPending}
        errorMessage={
          mutation.isError ? mutationErrorMessage(mutation.error) : null
        }
        onCancel={() => setIsConfirming(false)}
        onConfirm={confirmChange}
      />
    </Stack>
  )
}

interface RoleControlProps {
  userId: string
  currentRole: UserRole
  onSuccess: (message: string) => void
}

function RoleControl({
  userId,
  currentRole,
  onSuccess,
}: RoleControlProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole)
  const [isConfirming, setIsConfirming] = useState(false)
  const mutation = useUpdateAdminUserRoleMutation(userId)

  const openConfirmation = () => {
    mutation.reset()
    setIsConfirming(true)
  }

  const confirmChange = () => {
    mutation.mutate(selectedRole, {
      onSuccess: () => {
        setIsConfirming(false)
        onSuccess(`Role changed to ${readableLabel(selectedRole)}.`)
      },
    })
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h2" sx={{ fontSize: 23 }}>
        Account role
      </Typography>
      <Typography color="text.secondary">
        Admin access includes user and content management permissions.
      </Typography>
      <TextField
        select
        label="Role"
        value={selectedRole}
        onChange={(event) => {
          const nextRole = USER_ROLES.find(
            (role) => role === event.target.value,
          )
          if (nextRole) setSelectedRole(nextRole)
        }}
      >
        {USER_ROLES.map((role) => (
          <MenuItem key={role} value={role}>
            {readableLabel(role)}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        disabled={selectedRole === currentRole}
        onClick={openConfirmation}
        sx={{ alignSelf: 'flex-start' }}
      >
        Change role
      </Button>
      <ConfirmationDialog
        open={isConfirming}
        title="Confirm role change"
        description={`Change this account’s role from ${readableLabel(currentRole)} to ${readableLabel(selectedRole)}? This changes its administrative access.`}
        confirmLabel="Change role"
        isPending={mutation.isPending}
        errorMessage={
          mutation.isError ? mutationErrorMessage(mutation.error) : null
        }
        onCancel={() => setIsConfirming(false)}
        onConfirm={confirmChange}
      />
    </Stack>
  )
}

export function AdminUserDetailPage() {
  const { userId = '' } = useParams()
  const detailQuery = useAdminUserDetailQuery(userId)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (detailQuery.isPending) {
    return <LoadingState />
  }

  if (detailQuery.isError) {
    const error = normalizeApiError(detailQuery.error)

    return (
      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
          User details
        </Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => detailQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {error.status === 404 ? 'User not found.' : error.message}
        </Alert>
        <Button
          component={RouterLink}
          to={routePaths.adminUsers}
          variant="outlined"
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to users
        </Button>
      </Stack>
    )
  }

  const { user, learningSummary } = detailQuery.data
  const displayName = user.displayName

  return (
    <Stack spacing={3.5}>
      <Button
        component={RouterLink}
        to={routePaths.adminUsers}
        color="inherit"
        sx={{ alignSelf: 'flex-start', px: 0 }}
      >
        ← Back to users
      </Button>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt=""
          sx={{
            width: 64,
            height: 64,
            bgcolor: 'primary.light',
            color: 'primary.dark',
            fontFamily: '"Merriweather", serif',
            fontSize: 28,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack spacing={0.5}>
          <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
            {displayName}
          </Typography>
          <Typography color="text.secondary">{user.email}</Typography>
        </Stack>
      </Stack>

      {successMessage ? (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={3}>
              <Typography variant="h2" sx={{ fontSize: 27 }}>
                Account information
              </Typography>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <DetailField label="Email" value={user.email} />
                <DetailField
                  label="Role"
                  value={readableLabel(user.role)}
                />
                <DetailField
                  label="Status"
                  value={readableLabel(user.status)}
                />
                <DetailField
                  label="Last login"
                  value={formatDate(user.lastLoginAt)}
                />
                <DetailField
                  label="Created"
                  value={formatDate(user.createdAt)}
                />
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={3}>
              <Typography variant="h2" sx={{ fontSize: 27 }}>
                Profile
              </Typography>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <DetailField label="Display name" value={user.displayName} />
                <DetailField label="CEFR level" value={user.currentCefrLevel ?? 'Not set'} />
                <DetailField
                  label="Preferred language"
                  value={user.preferredLanguage}
                />
                <DetailField
                  label="Learning goal"
                  value={user.learningGoal ?? 'Not set'}
                />
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={3}>
              <Typography variant="h2" sx={{ fontSize: 27 }}>
                Learning summary
              </Typography>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {[
                  ['Saved vocabulary', learningSummary.savedVocabularyCount],
                  [
                    'Completed articles',
                    learningSummary.completedArticleCount,
                  ],
                ].map(([label, value]) => (
                  <Paper
                    component="div"
                    variant="outlined"
                    key={label}
                    sx={{ p: 2.5, bgcolor: 'background.default' }}
                  >
                    <Typography
                      component="dd"
                      sx={{
                        m: 0,
                        fontFamily: '"Merriweather", serif',
                        fontSize: 32,
                        fontWeight: 700,
                        color: 'primary.dark',
                      }}
                    >
                      {value}
                    </Typography>
                    <Typography
                      component="dt"
                      color="text.secondary"
                      sx={{ mt: 0.5, fontSize: 13, fontWeight: 700 }}
                    >
                      {label}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Paper>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack spacing={3}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap' }}
            >
              <Chip
                label={readableLabel(user.role)}
                color={user.role === 'ADMIN' ? 'primary' : 'default'}
              />
              <Chip
                label={readableLabel(user.status)}
                color={
                  user.status === 'ACTIVE'
                    ? 'success'
                    : user.status === 'SUSPENDED'
                      ? 'warning'
                      : 'error'
                }
                variant="outlined"
              />
            </Stack>
            <Divider />
            <StatusControl
              userId={user.id}
              currentStatus={user.status}
              onSuccess={setSuccessMessage}
            />
            <Divider />
            <RoleControl
              userId={user.id}
              currentRole={user.role}
              onSuccess={setSuccessMessage}
            />
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
