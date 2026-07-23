import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { setAccessToken } from '~/api/client'
import type { MyAccount } from '~/api/types'
import { getCurrentUserAPI } from '~/apis'

import type { RootState } from './store'
import { clearCurrentUser, setCurrentUser } from './userSlice'

export type SessionStatus =
  | 'idle'
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated'

interface SessionState {
  status: SessionStatus
}

const initialState: SessionState = {
  status: 'idle',
}

export const restoreCurrentSession = createAsyncThunk<MyAccount | null>(
  'session/restoreCurrentSession',
  async (_, { dispatch }) => {
    try {
      const currentUser = await getCurrentUserAPI()
      dispatch(setCurrentUser(currentUser))
      return currentUser
    } catch {
      setAccessToken(null)
      dispatch(clearCurrentUser())
      return null
    }
  },
  {
    condition: (_, { getState }) =>
      (getState() as RootState).session.status === 'idle',
  },
)

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreCurrentSession.pending, (state) => {
        state.status = 'restoring'
      })
      .addCase(restoreCurrentSession.fulfilled, (state, action) => {
        state.status = action.payload
          ? 'authenticated'
          : 'unauthenticated'
      })
      .addCase(restoreCurrentSession.rejected, (state) => {
        state.status = 'unauthenticated'
      })
      .addCase(setCurrentUser, (state) => {
        state.status = 'authenticated'
      })
      .addCase(clearCurrentUser, (state) => {
        state.status = 'unauthenticated'
      })
  },
})

export const selectSessionStatus = (state: RootState) => state.session.status
export const selectSessionIsResolved = (state: RootState) =>
  state.session.status === 'authenticated' ||
  state.session.status === 'unauthenticated'

export default sessionSlice.reducer
