import { combineReducers, createSlice } from '@reduxjs/toolkit'
import { NUMBER_OF_COMPONENTS } from './constants'

export const getSliceName = (index: number) => `counter_${index}`

const createStateSlice = (index: number) => {
  return createSlice({
    name: getSliceName(index),
    initialState: {
      counter: 0,
    },
    reducers: {
      increment(state) {
        state.counter += 1
      },
    },
  })
}

const slices = Array.from({
  length: NUMBER_OF_COMPONENTS,
}).map((_, i) => createStateSlice(i))

export const rootReducer = combineReducers(
  slices.reduce(
    (acc: Record<string, typeof slices[number]['reducer']>, slice) => {
      acc[slice.name] = slice.reducer
      return acc
    },
    {}
  )
)

export const incrementActions = slices.map((slice) => slice.actions.increment)

export type RootState = ReturnType<typeof rootReducer>
