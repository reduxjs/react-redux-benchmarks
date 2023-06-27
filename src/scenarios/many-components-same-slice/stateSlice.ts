import { createSlice } from '@reduxjs/toolkit'

const { reducer, actions } = createSlice({
  name: 'counter',
  initialState: {
    counter: 0,
  },
  reducers: {
    increment(state) {
      state.counter += 1
    },
  },
})

export const { increment } = actions

export default reducer
