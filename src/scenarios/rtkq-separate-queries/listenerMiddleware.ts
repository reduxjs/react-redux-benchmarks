// listenerMiddleware.ts
import { createListenerMiddleware, addListener } from '@reduxjs/toolkit'
import type { TypedStartListening, TypedAddListener } from '@reduxjs/toolkit'

import type { RootState, AppDispatch } from './store'
import { api } from './api'
import { NUMBER_OF_COMPONENTS } from './constants'

export const listenerMiddleware = createListenerMiddleware()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

export const startAppListening =
  listenerMiddleware.startListening as AppStartListening

export const addAppListener = addListener as TypedAddListener<
  RootState,
  AppDispatch
>

startAppListening({
  matcher: api.endpoints.some.matchFulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState()
    const { queries, subscriptions } = state.api
    const allQueries = Object.values(queries)

    const allSubscriptions = Object.values(subscriptions)
      .map((entry) => Object.values(entry!))
      .flat()

    console.log('Number of subscriptions: ', allSubscriptions.length)

    if (
      allSubscriptions.length === NUMBER_OF_COMPONENTS &&
      allQueries.every((query) => query?.status === 'fulfilled')
    ) {
      console.log('All queries fulfilled, re-fetching')
      await listenerApi.delay(10)
      listenerApi.dispatch(api.util.invalidateTags(['QUERY']))
    }
  },
})
