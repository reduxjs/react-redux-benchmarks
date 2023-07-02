import {
  configureStore,
  autoBatchEnhancer,
  createListenerMiddleware,
} from '@reduxjs/toolkit'

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
  },
  enhancers: (existingEnhancers) =>
    existingEnhancers.concat(autoBatchEnhancer({ type: 'raf' })),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
