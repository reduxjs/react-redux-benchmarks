import { createSlice, type PayloadAction, combineReducers } from '@reduxjs/toolkit'
import { NUM_ITEMS } from './constants'

export interface ItemEntry {
  id: number
  value: number
  status: 'idle' | 'pending' | 'done'
}

const initialItems: ItemEntry[] = Array.from({ length: NUM_ITEMS }).map(
  (_, i) => ({
    id: i,
    value: 0,
    status: 'idle' as const,
  })
)

const itemsSlice = createSlice({
  name: 'items',
  initialState: {
    list: initialItems,
    lastUpdated: Date.now(),
  },
  reducers: {
    setStatus(
      state,
      action: PayloadAction<{
        id: number
        status: 'idle' | 'pending' | 'done'
      }>
    ) {
      const item = state.list.find((i) => i.id === action.payload.id)
      if (item) item.status = action.payload.status
    },
    updateValue(state, action: PayloadAction<{ id: number; value: number }>) {
      const item = state.list.find((i) => i.id === action.payload.id)
      if (item) item.value = action.payload.value
    },
    touch(state) {
      state.lastUpdated = Date.now()
    },
  },
})

const countersSlice = createSlice({
  name: 'counters',
  initialState: {
    a: 0,
    b: 0,
    c: 0,
    total: 0,
  },
  reducers: {
    incrementA(state) {
      state.a += 1
    },
    incrementB(state) {
      state.b += 1
    },
    incrementC(state) {
      state.c += 1
    },
    updateTotal(state) {
      state.total = state.a + state.b + state.c
    },
  },
})

const logSlice = createSlice({
  name: 'log',
  initialState: {
    entries: [] as string[],
    count: 0,
  },
  reducers: {
    append(state, action: PayloadAction<string>) {
      state.entries.push(action.payload)
      state.count += 1
    },
  },
})

export const rootReducer = combineReducers({
  items: itemsSlice.reducer,
  counters: countersSlice.reducer,
  log: logSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const { setStatus, updateValue, touch } = itemsSlice.actions
export const { incrementA, incrementB, incrementC, updateTotal } =
  countersSlice.actions
export const { append } = logSlice.actions
