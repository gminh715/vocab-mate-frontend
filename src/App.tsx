import { useEffect } from 'react'

import { Route, Routes } from 'react-router-dom'

import RouteGuard from '~/components/routing/RouteGuard'
import LoadingState from '~/components/states/LoadingState'
import ForbiddenPage from '~/pages/Forbidden/ForbiddenPage'
import HomePage from '~/pages/Home/HomePage'
import LoginPage from '~/pages/Login/LoginPage'
import NotFoundPage from '~/pages/NotFound/NotFoundPage'
import RegisterPage from '~/pages/Register/RegisterPage'
import { useAppDispatch, useAppSelector } from '~/redux/hooks'
import {
  restoreCurrentSession,
  selectSessionIsResolved,
} from '~/redux/sessionSlice'
import { ROUTE_PATHS } from '~/routes/paths'

function App() {
  const dispatch = useAppDispatch()
  const isSessionResolved = useAppSelector(selectSessionIsResolved)

  useEffect(() => {
    void dispatch(restoreCurrentSession())
  }, [dispatch])

  if (!isSessionResolved) {
    return <LoadingState message="Restoring your session…" />
  }

  return (
    <Routes>
      <Route element={<RouteGuard access="authenticated" />}>
        <Route path={ROUTE_PATHS.home} element={<HomePage />} />
      </Route>

      <Route element={<RouteGuard access="guest" />}>
        <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
        <Route path={ROUTE_PATHS.register} element={<RegisterPage />} />
      </Route>

      <Route
        path={ROUTE_PATHS.forbidden}
        element={<ForbiddenPage />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
