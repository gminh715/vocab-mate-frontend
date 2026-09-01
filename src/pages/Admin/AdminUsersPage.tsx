import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  Link as RouterLink,
  useSearchParams,
} from 'react-router-dom'
import { DebouncedSearchField } from '@/components/Shared/DebouncedSearchField'
import { LoadingState } from '@/components/Shared/LoadingState'
import { normalizeApiError } from '@/config/apiClient'
import { useAdminUserListQuery } from '@/hooks/Admin/useAdminUsers'
import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from '@/types/Auth/auth'
import { adminUserListParamsFromSearchParams } from '@/utils/Admin/adminUserListParams'
import { adminUserPath } from '@/utils/paths'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatDate = (value: string | null): string =>
  value ? dateFormatter.format(new Date(value)) : 'Never'

const readableLabel = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase()

const roleColor = (role: UserRole): 'primary' | 'default' =>
  role === 'ADMIN' ? 'primary' : 'default'

const statusColor = (
  status: UserStatus,
): 'success' | 'warning' | 'error' =>
  status === 'ACTIVE'
    ? 'success'
    : status === 'SUSPENDED'
      ? 'warning'
      : 'error'

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = adminUserListParamsFromSearchParams(searchParams)
  const usersQuery = useAdminUserListQuery(params)

  const updateSearchParams = (
    updates: Record<string, string | undefined>,
    resetPage = true,
  ) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          next.set(key, value)
        } else {
          next.delete(key)
        }
      })

      if (resetPage) next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams()
      const limit = current.get('limit')
      const sort = current.get('sort')
      if (limit) next.set('limit', limit)
      if (sort) next.set('sort', sort)
      return next
    })
  }

  const hasFilters = Boolean(params.q || params.role || params.status)
  const listData = usersQuery.data

  return (
    <Stack spacing={3.5}>
      <Stack spacing={1} sx={{ maxWidth: 760 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
          Users
        </Typography>
        <Typography color="text.secondary">
          Find accounts, review access, and open a user’s learning record.
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { lg: 'center' } }}
        >
          <DebouncedSearchField
            key={params.q ?? ''}
            initialValue={params.q ?? ''}
            label="Search users"
            placeholder="Email or display name"
            onCommit={(q) =>
              updateSearchParams({ q: q || undefined })
            }
          />
          <TextField
            select
            label="Role"
            value={params.role ?? ''}
            onChange={(event) =>
              updateSearchParams({
                role: event.target.value || undefined,
              })
            }
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All roles</MenuItem>
            {USER_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {readableLabel(role)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={params.status ?? ''}
            onChange={(event) =>
              updateSearchParams({
                status: event.target.value || undefined,
              })
            }
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {USER_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {readableLabel(status)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Sort"
            value={params.sort}
            onChange={(event) =>
              updateSearchParams({ sort: event.target.value })
            }
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
          </TextField>
          {hasFilters ? (
            <Button
              color="inherit"
              onClick={clearFilters}
              sx={{ alignSelf: { xs: 'flex-start', lg: 'center' } }}
            >
              Clear filters
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {usersQuery.isPending ? (
        <LoadingState />
      ) : usersQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => usersQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {normalizeApiError(usersQuery.error).message}
        </Alert>
      ) : listData &&
        listData.items.length === 0 &&
        listData.meta.total > 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              No users on this page
            </Typography>
            <Typography color="text.secondary">
              The selected page is outside the available results.
            </Typography>
            <Button
              variant="outlined"
              onClick={() =>
                updateSearchParams({ page: '1' }, false)
              }
            >
              Go to first page
            </Button>
          </Stack>
        </Paper>
      ) : listData && listData.items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              {hasFilters ? 'No matching users' : 'No users yet'}
            </Typography>
            <Typography color="text.secondary">
              {hasFilters
                ? 'Change or clear the filters to broaden your search.'
                : 'User accounts will appear here when they are available.'}
            </Typography>
            {hasFilters ? (
              <Button variant="outlined" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : listData ? (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          {usersQuery.isFetching ? (
            <LinearProgress aria-label="Refreshing users" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}
          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Display name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last login</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listData.items.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>
                        {user.displayName}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={readableLabel(user.role)}
                        color={roleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={readableLabel(user.status)}
                        color={statusColor(user.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Button
                        component={RouterLink}
                        to={adminUserPath(user.id)}
                        variant="outlined"
                        size="small"
                        aria-label={`View ${user.displayName || user.email}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={listData.meta.total}
            page={Math.max(0, listData.meta.page - 1)}
            rowsPerPage={listData.meta.limit}
            rowsPerPageOptions={[10, 20, 50, 100]}
            onPageChange={(_, page) =>
              updateSearchParams({ page: String(page + 1) }, false)
            }
            onRowsPerPageChange={(event) =>
              updateSearchParams({ limit: event.target.value })
            }
          />
        </Paper>
      ) : null}
    </Stack>
  )
}
