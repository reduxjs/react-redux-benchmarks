import {
  createListenerMiddleware,
  type TypedStartListening,
} from '@reduxjs/toolkit'
import type { RootState } from './state'
import { incrementA, incrementB, incrementC, updateTotal, append } from './state'

export const listenerMiddleware = createListenerMiddleware()

type AppStartListening = TypedStartListening<RootState>
const startListening = listenerMiddleware.startListening as AppStartListening

startListening({
  actionCreator: incrementA,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(incrementB())
  },
})

startListening({
  actionCreator: incrementB,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(incrementC())
  },
})

startListening({
  actionCreator: incrementC,
  effect: async (_action, listenerApi) => {
    listenerApi.dispatch(updateTotal())
    listenerApi.dispatch(append(`cascade complete at ${Date.now()}`))
  },
})
