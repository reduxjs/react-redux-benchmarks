import { combineReducers, createSlice } from '@reduxjs/toolkit'
import { NUMBER_OF_SLICES } from './constants'

export const getSliceName = (index: number) => `feature_${index}`

interface SliceState {
  counter: number
  meta: {
    label: string
    updatedAt: number
  }
  settings: {
    enabled: boolean
    threshold: number
  }
}

const createStateSlice = (index: number) => {
  const initialState: SliceState = {
    counter: 0,
    meta: {
      label: `feature ${index}`,
      updatedAt: 0,
    },
    settings: {
      enabled: index % 2 === 0,
      threshold: index,
    },
  }

  return createSlice({
    name: getSliceName(index),
    initialState,
    reducers: {
      increment(state) {
        state.counter += 1
        state.meta.updatedAt = state.counter
      },
      toggle(state) {
        state.settings.enabled = !state.settings.enabled
      },
    },
  })
}

const slices = Array.from({ length: NUMBER_OF_SLICES }).map((_, i) =>
  createStateSlice(i),
)

export const rootReducer = combineReducers(
  slices.reduce(
    (acc: Record<string, (typeof slices)[number]['reducer']>, slice) => {
      acc[slice.name] = slice.reducer
      return acc
    },
    {},
  ),
)

export const incrementActions = slices.map((slice) => slice.actions.increment)
export const toggleActions = slices.map((slice) => slice.actions.toggle)

export type RootState = ReturnType<typeof rootReducer>
