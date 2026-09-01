import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
  type InitialEntry,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/routes/AppRoutes'
import { appTheme } from '@/theme'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { authApi } from '@/api'
import i18n from '@/i18n/i18n'

const renderRoute = (initialEntries: InitialEntry[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const router = createMemoryRouter(
    [{ path: '*', element: <AppRoutes /> }],
    { initialEntries },
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

describe('Bilingual Auth UI and Interactions', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('vi')
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders LoginPage in Vietnamese by default and switches to English', async () => {
    renderRoute(['/login'])
    const user = userEvent.setup()

    // Verify Vietnamese strings
    expect(await screen.findByRole('heading', { name: 'Chào mừng trở lại' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument()

    // Switch language to English
    const switcherBtn = screen.getByRole('button', { name: /Tiếng Việt/i })
    await user.click(switcherBtn)

    const englishOption = await screen.findByRole('menuitem', { name: /English/i })
    await user.click(englishOption)

    // Verify English strings
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('toggles password visibility on LoginPage', async () => {
    renderRoute(['/login'])
    const user = userEvent.setup()

    const passwordInput = await screen.findByLabelText('Mật khẩu')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByRole('button', { name: 'Hiện mật khẩu' })
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toBeInTheDocument()
  })

  it('renders RegisterPage in Vietnamese and updates live password criteria as user types', async () => {
    renderRoute(['/register'])
    const user = userEvent.setup()

    expect(await screen.findByRole('heading', { name: 'Tạo tài khoản mới' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tạo tài khoản' })).toBeInTheDocument()

    const passwordInput = screen.getByLabelText('Mật khẩu')
    expect(passwordInput).toBeInTheDocument()

    // Criteria labels in Vietnamese
    expect(screen.getByText('Từ 8 đến 72 ký tự')).toBeInTheDocument()
    expect(screen.getByText('Ít nhất một chữ cái thường')).toBeInTheDocument()
    expect(screen.getByText('Ít nhất một chữ cái hoa')).toBeInTheDocument()
    expect(screen.getByText('Ít nhất một chữ số')).toBeInTheDocument()
    expect(screen.getByText('Ít nhất một ký tự đặc biệt')).toBeInTheDocument()

    // Type a strong password
    await user.type(passwordInput, 'Strong@123')

    // Switch language to English on register page
    const switcherBtn = screen.getByRole('button', { name: /Tiếng Việt/i })
    await user.click(switcherBtn)
    const englishOption = await screen.findByRole('menuitem', { name: /English/i })
    await user.click(englishOption)

    // Verify translated elements
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create Your Account' })).toBeInTheDocument()
    })
    expect(screen.getByText('8–72 characters')).toBeInTheDocument()
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument()
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })
})
