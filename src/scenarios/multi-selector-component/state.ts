import { createSlice, PayloadAction, combineReducers } from '@reduxjs/toolkit'
import { NUM_DATA_ITEMS } from './constants'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userId: 1,
    role: 'user' as 'admin' | 'user' | 'guest',
    token: 'abc123',
    loginCount: 0,
  },
  reducers: {
    incrementLoginCount(state) {
      state.loginCount++
    },
  },
})

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: {
    theme: 'dark' as 'light' | 'dark',
    language: 'en',
    pageSize: 25,
    updatedAt: Date.now(),
  },
  reducers: {
    touch(state) {
      state.updatedAt = Date.now()
    },
  },
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    totalCount: 0,
  },
  reducers: {
    incrementUnread(state) {
      state.unreadCount++
      state.totalCount++
    },
  },
})

interface DataItem {
  id: number
  value: number
  label: string
}

const initialItems: Record<number, DataItem> = {}
for (let i = 0; i < NUM_DATA_ITEMS; i++) {
  initialItems[i] = {
    id: i,
    value: Math.floor(Math.random() * 1000),
    label: `Item ${i}`,
  }
}

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    items: initialItems,
    totalCount: NUM_DATA_ITEMS,
    lastUpdated: Date.now(),
  },
  reducers: {
    updateRandomItem(state, action: PayloadAction<number>) {
      const id = action.payload
      if (state.items[id]) {
        state.items[id].value = Math.floor(Math.random() * 1000)
        state.lastUpdated = Date.now()
      }
    },
  },
})

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    activeTab: 'dashboard',
    scrollPosition: 0,
  },
  reducers: {
    updateScrollPosition(state) {
      state.scrollPosition = Math.floor(Math.random() * 10000)
    },
  },
})

export const rootReducer = combineReducers({
  auth: authSlice.reducer,
  preferences: preferencesSlice.reducer,
  notifications: notificationsSlice.reducer,
  data: dataSlice.reducer,
  ui: uiSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const { incrementLoginCount } = authSlice.actions
export const { touch } = preferencesSlice.actions
export const { incrementUnread } = notificationsSlice.actions
export const { updateRandomItem } = dataSlice.actions
export const { updateScrollPosition } = uiSlice.actions
