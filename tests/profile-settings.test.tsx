import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { profileApi } from '@/api/User/ProfileApi'
import { authApi } from '@/api/Auth/AuthApi'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { UserAvatar } from '@/components/Shared/UserAvatar'
import { readingQueryKeys } from '@/hooks/Reading/useReading'
import { AppRoutes } from '@/routes/AppRoutes'
import {
  profileFormSchema,
  toUpdateMyProfileRequest,
} from '@/schemas/User/profile'
import { appTheme } from '@/theme'
import type {
  CurrentUser,
  UpdatedMyProfile,
} from '@/types/Auth/auth'

const currentUser: CurrentUser = {
  id: 'user-1',
  email: 'learner@example.com',
  role: 'USER',
  status: 'ACTIVE',
  profile: {
    displayName: 'Mai',
    avatarUrl: null,
    currentCefrLevel: 'B1',
    learningGoal: 'C1',
    preferredLanguage: 'vi',
  },
}

const updateResult = (
  profile: CurrentUser['profile'],
): UpdatedMyProfile => ({
  user: {
    id: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    status: currentUser.status,
  },
  profile,
})

const renderSettings = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const router = createMemoryRouter(
    [{ path: '*', element: <AppRoutes /> }],
    { initialEntries: ['/settings/profile'] },
  )

  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )

  return { queryClient, router }
}

describe('profile DTO mapping and validation', () => {
  it('maps only changed profile fields and cannot include account fields', () => {
    const request = toUpdateMyProfileRequest(
      {
        displayName: 'Mai Nguyen',
        avatarUrl: undefined,
        currentCefrLevel: 'B1',
        learningGoal: 'C1',
        preferredLanguage: 'en',
      },
      currentUser.profile,
    )

    expect(request).toEqual({
      displayName: 'Mai Nguyen',
      preferredLanguage: 'en',
    })
    expect(request).not.toHaveProperty('email')
    expect(request).not.toHaveProperty('role')
    expect(request).not.toHaveProperty('status')
    expect(request).not.toHaveProperty('password')
  })

  it('requires backend-required profile fields', () => {
    const invalid = profileFormSchema.safeParse({
      displayName: '   ',
      avatarUrl: '',
      currentCefrLevel: 'B2',
      learningGoal: 'C1',
      preferredLanguage: '',
    })

    expect(invalid.success).toBe(false)
    if (invalid.success) return
    expect(invalid.error.flatten().fieldErrors).toMatchObject({
      displayName: ['Enter your display name.'],
      preferredLanguage: ['Choose a supported language.'],
    })
  })

  it('enforces the backend CEFR learning-goal rule', () => {
    const invalid = profileFormSchema.safeParse({
      displayName: 'Mai',
      avatarUrl: '',
      currentCefrLevel: 'B2',
      learningGoal: 'B1',
      preferredLanguage: 'vi',
    })

    expect(invalid.success).toBe(false)
    if (invalid.success) return
    expect(invalid.error.flatten().fieldErrors.learningGoal).toEqual([
      'Learning goal must be higher than your current CEFR level.',
    ])
  })
})

describe('Profile settings UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(currentUser)
  })

  it('shows account-only fields as read-only details', async () => {
    renderSettings()

    await screen.findByRole(
      'heading',
      { name: 'Profile settings' },
      { timeout: 4_000 },
    )
    expect(screen.getByText('learner@example.com')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Preferred language'),
    ).not.toBeInTheDocument()
  })

  it('opens account actions and updates the stored language preference', async () => {
    const updateSpy = vi
      .spyOn(profileApi, 'update')
      .mockResolvedValue(
        updateResult({
          ...currentUser.profile,
          preferredLanguage: 'en',
        }),
      )
    renderSettings()
    const user = userEvent.setup()

    const accountButton = await screen.findByRole('button', {
      name: 'Open account menu for Mai',
    })
    expect(
      screen.queryByRole('button', { name: 'Sign out' }),
    ).not.toBeInTheDocument()

    await user.click(accountButton)

    expect(
      screen.getByRole('menuitem', { name: 'Profile settings' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('menuitem', {
        name: /Language settings Current: VI · Switch to EN/,
      }),
    )

    expect(updateSpy.mock.calls[0]?.[0]).toEqual({
      preferredLanguage: 'en',
    })
    expect(
      await screen.findByText('Preferred language changed to EN.'),
    ).toBeInTheDocument()
  })

  it('tracks dirty state and protects dirty input on browser unload', async () => {
    renderSettings()
    const user = userEvent.setup()
    const save = await screen.findByRole('button', {
      name: 'Save changes',
    })

    expect(save).toBeDisabled()
    await user.type(screen.getByLabelText('Display name'), ' Nguyen')

    expect(save).toBeEnabled()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('keeps required-field input and displays a field error', async () => {
    renderSettings()
    const user = userEvent.setup()
    const displayName = await screen.findByLabelText('Display name')

    await user.clear(displayName)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      await screen.findByText('Enter your display name.'),
    ).toBeInTheDocument()
    expect(displayName).toHaveValue('')
  })

  it('falls back to an initial after an avatar image fails', () => {
    render(
      <ThemeProvider theme={appTheme}>
        <UserAvatar
          displayName="Mai"
          avatarUrl="https://images.example.test/missing.png"
          alt="Avatar preview"
        />
      </ThemeProvider>,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Avatar preview' }))

    expect(
      screen.queryByRole('img', { name: 'Avatar preview' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it(
    'updates shared header identity and invalidates reader payloads after a CEFR change',
    async () => {
      const avatarUrl = 'https://images.example.test/mai.png'
      const updateSpy = vi
        .spyOn(profileApi, 'update')
        .mockImplementation(async (request) =>
          updateResult({
            ...currentUser.profile,
            ...request,
            displayName:
              request.displayName ?? currentUser.profile.displayName,
            avatarUrl:
              request.avatarUrl ?? currentUser.profile.avatarUrl,
            currentCefrLevel:
              request.currentCefrLevel ??
              currentUser.profile.currentCefrLevel,
            learningGoal:
              request.learningGoal ?? currentUser.profile.learningGoal,
            preferredLanguage:
              request.preferredLanguage ??
              currentUser.profile.preferredLanguage,
          }),
        )
      const { queryClient } = renderSettings()
      queryClient.setQueryData(readingQueryKeys.article('city-trees'), {
        highlightedTermIds: ['term-1'],
      })
      const user = userEvent.setup()

      const displayName = await screen.findByLabelText('Display name')
      await user.clear(displayName)
      await user.type(displayName, 'Mai Nguyen')
      await user.type(screen.getByLabelText('Avatar URL'), avatarUrl)
      await user.click(screen.getByLabelText('Current CEFR level'))
      await user.click(screen.getByRole('option', { name: 'B2' }))
      await user.click(
        screen.getByRole('button', { name: 'Save changes' }),
      )

      expect(
        await screen.findByText('Profile changes saved.'),
      ).toBeInTheDocument()
      expect(updateSpy.mock.calls[0]?.[0]).toEqual({
        displayName: 'Mai Nguyen',
        avatarUrl,
        currentCefrLevel: 'B2',
      })
      expect(updateSpy.mock.calls[0]?.[0]).not.toHaveProperty('email')
      expect(updateSpy.mock.calls[0]?.[0]).not.toHaveProperty('role')
      expect(updateSpy.mock.calls[0]?.[0]).not.toHaveProperty('status')

      const identityButton = screen.getByRole('button', {
        name: 'Open account menu for Mai Nguyen',
      })
      expect(identityButton.querySelector('img')).toHaveAttribute(
        'src',
        avatarUrl,
      )
      await waitFor(() => {
        expect(
          queryClient.getQueryState(
            readingQueryKeys.article('city-trees'),
          )?.isInvalidated,
        ).toBe(true)
      })
    },
    10_000,
  )
})
