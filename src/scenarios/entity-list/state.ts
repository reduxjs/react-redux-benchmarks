import {
  createEntityAdapter,
  createSlice,
  type EntityState,
} from '@reduxjs/toolkit'
import { NUM_ITEMS, CATEGORIES } from './constants'

export interface Item {
  id: number
  value: number
  label: string
  category: string
  updatedAt: number
}

const itemsAdapter = createEntityAdapter<Item>()

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
  initialState: itemsAdapter.getInitialState(),
  reducers: {
    updateOne: itemsAdapter.updateOne,
    addOne: itemsAdapter.addOne,
    removeOne: itemsAdapter.removeOne,
    updateMany: itemsAdapter.updateMany,
    setAll: itemsAdapter.setAll,
  },
})

const seededState = itemsAdapter.setAll(
  itemsAdapter.getInitialState(),
  initialItems
)

export const rootReducer = itemsSlice.reducer

export const preloadedState = seededState

export const { updateOne, addOne, removeOne, updateMany, setAll } =
  itemsSlice.actions

const selectors = itemsAdapter.getSelectors(
  (state: RootState) => state
)

export const { selectIds, selectById, selectAll, selectTotal } = selectors

export let nextId = NUM_ITEMS

export const getNextId = () => nextId++

export type RootState = EntityState<Item, number>
