import type { AppStore } from './index'
import { NUM_ITEMS } from './constants'
import {
  setStatus,
  updateValue,
  touch,
  incrementA,
  type RootState,
} from './state'

const randomItemId = () => Math.floor(Math.random() * NUM_ITEMS)

export function syncBurst(store: AppStore) {
  const id = randomItemId()
  store.dispatch(setStatus({ id, status: 'pending' }))
  store.dispatch(updateValue({ id, value: Math.floor(Math.random() * 1000) }))
  store.dispatch(setStatus({ id, status: 'done' }))
  store.dispatch(touch())
  store.dispatch(incrementA())
}

export function thunkBurst(store: AppStore) {
  const id = randomItemId()
  store.dispatch(setStatus({ id, status: 'pending' }))
  setTimeout(() => {
    store.dispatch(updateValue({ id, value: Math.floor(Math.random() * 1000) }))
    store.dispatch(setStatus({ id, status: 'done' }))
  }, 0)
}

export function listenerCascade(store: AppStore) {
  store.dispatch(incrementA())
}

export function doRandomDispatch(store: AppStore) {
  const roll = Math.random()
  if (roll < 0.4) {
    syncBurst(store)
  } else if (roll < 0.7) {
    thunkBurst(store)
  } else {
    listenerCascade(store)
  }
}
