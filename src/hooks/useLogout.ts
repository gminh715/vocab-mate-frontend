import { useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { logoutAPI } from '~/apis'
import { useAppDispatch } from '~/redux/hooks'
import { persistor } from '~/redux/store'
import { clearCurrentUser } from '~/redux/userSlice'
import { ROUTE_PATHS } from '~/routes/paths'

export const useLogout = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const pendingRef = useRef(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async (): Promise<void> => {
    if (pendingRef.current) return

    pendingRef.current = true
    setIsLoggingOut(true)

    try {
      await logoutAPI()
    } catch {
      // Local cleanup must continue when the server session is already invalid.
    } finally {
      dispatch(clearCurrentUser())

      try {
        await persistor.flush()
      } finally {
        navigate(ROUTE_PATHS.login, { replace: true })
        pendingRef.current = false
        setIsLoggingOut(false)
      }
    }
  }

  return { isLoggingOut, logout }
}
