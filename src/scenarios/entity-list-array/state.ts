import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { NUM_ITEMS, CATEGORIES } from './constants'

export interface Item {
  id: number
  value: number
  label: string
  category: string
  updatedAt: number
}

const createItem = (id: number): Item => ({
  id,
  value: Math.floor(Math.random() * 1000),
  label: `Item ${id}`,
  category: CATEGORIES[id % CATEGORIES.length],
  updatedAt: Date.now(),
})

const initialItems = Array.from({ length: NUM_ITEMS }).map((_, i) =>
  createItem(i)
)

const itemsSlice = createSlice({
  name: 'items',
  initialState: initialItems,
  reducers: {
    updateOne(
      state,
      action: PayloadAction<{ id: number; changes: Partial<Item> }>
    ) {
      const { id, changes } = action.payload
      const item = state.find((i) => i.id === id)
      if (item) {
        Object.assign(item, changes)
      }
    },
    addOne(state, action: PayloadAction<Item>) {
      state.push(action.payload)
    },
    removeOne(state, action: PayloadAction<number>) {
      const index = state.findIndex((i) => i.id === action.payload)
      if (index !== -1) {
        state.splice(index, 1)
      }
    },
    updateMany(
      state,
      action: PayloadAction<{ id: number; changes: Partial<Item> }[]>
    ) {
      for (const { id, changes } of action.payload) {
        const item = state.find((i) => i.id === id)
        if (item) {
          Object.assign(item, changes)
        }
      }
    },
    setAll(_state, action: PayloadAction<Item[]>) {
      return action.payload
    },
  },
})

export const rootReducer = itemsSlice.reducer

export const { updateOne, addOne, removeOne, updateMany, setAll } =
  itemsSlice.actions

export const selectIds = (state: RootState) => state.map((i) => i.id)

export const selectById = (state: RootState, id: number) =>
  state.find((i) => i.id === id)

export const selectAll = (state: RootState) => state

export const selectTotal = (state: RootState) => state.length

export let nextId = NUM_ITEMS

export const getNextId = () => nextId++

export type RootState = Item[]
