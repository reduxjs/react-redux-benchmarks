import { combineReducers, createSlice } from '@reduxjs/toolkit'
import { NUMBER_OF_SLICES } from './constants'

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
  length: NUMBER_OF_SLICES,
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

export const incrementFirstSlice = slices[0].actions.increment
export const firstSliceName = getSliceName(0)

export type RootState = ReturnType<typeof rootReducer>
