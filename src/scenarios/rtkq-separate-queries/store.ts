import { configureStore } from '@reduxjs/toolkit'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import { api } from './api'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    })
      .concat(api.middleware)
      .concat(dispatchTimingMiddleware),
})

export type AppStore = typeof store
