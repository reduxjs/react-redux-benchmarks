import {
  configureStore,
  autoBatchEnhancer,
  createListenerMiddleware,
} from '@reduxjs/toolkit'

import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import { listenerMiddleware } from './listenerMiddleware'
import { api } from './api'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware(gDm) {
    return gDm({ immutableCheck: false, serializableCheck: false })
      .prepend(listenerMiddleware.middleware)
      .concat(api.middleware)
      .concat(dispatchTimingMiddleware)
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
