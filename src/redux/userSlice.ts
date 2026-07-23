import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { PublicUser, UserProfile } from '~/api/types'

import type { RootState } from './store'

interface CurrentUser extends PublicUser {
  profile?: UserProfile
}

interface UserState {
  currentUser: CurrentUser | null
}

const initialState: UserState = {
  currentUser: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<CurrentUser>) => {
      state.currentUser = action.payload
    },
    clearCurrentUser: (state) => {
      state.currentUser = null
    },
  },
})

export const { clearCurrentUser, setCurrentUser } = userSlice.actions

export const selectCurrentUser = (state: RootState) => state.user.currentUser
export const selectIsAuthenticated = (state: RootState) =>
  state.session.status === 'authenticated' &&
  state.user.currentUser?.status === 'ACTIVE'

export default userSlice.reducer
