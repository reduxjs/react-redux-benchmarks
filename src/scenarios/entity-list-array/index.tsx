import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import {
  rootReducer,
  updateOne,
  addOne,
  removeOne,
  updateMany,
  setAll,
  getNextId,
} from './state'
import { CATEGORIES } from './constants'
import App from './App'
import type { RootState } from './state'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

const randomCategory = () =>
  CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]

const dispatchRandom = () => {
  const roll = Math.random()
  const state = store.getState() as RootState

  if (state.length === 0) return

  const randomIndex = Math.floor(Math.random() * state.length)
  const randomId = state[randomIndex].id

  if (roll < 0.55) {
    // 55% — updateOne
    store.dispatch(
      updateOne({
        id: randomId,
        changes: {
          value: Math.floor(Math.random() * 1000),
          updatedAt: Date.now(),
        },
      })
    )
  } else if (roll < 0.7) {
    // 15% — addOne
    const id = getNextId()
    store.dispatch(
      addOne({
        id,
        value: Math.floor(Math.random() * 1000),
        label: `Item ${id}`,
        category: randomCategory(),
        updatedAt: Date.now(),
      })
    )
  } else if (roll < 0.8) {
    // 10% — removeOne
    store.dispatch(removeOne(randomId))
  } else if (roll < 0.95) {
    // 15% — updateMany (10 random items)
    const updates = Array.from({ length: Math.min(10, state.length) }).map(
      () => {
        const idx = Math.floor(Math.random() * state.length)
        return {
          id: state[idx].id,
          changes: {
            value: Math.floor(Math.random() * 1000),
            updatedAt: Date.now(),
          },
        }
      }
    )
    store.dispatch(updateMany(updates))
  } else {
    // 5% — setAll (regenerate 100 items)
    const items = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 1000),
      label: `Item ${i}`,
      category: randomCategory(),
      updatedAt: Date.now(),
    }))
    store.dispatch(setAll(items))
  }
}

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(dispatchRandom, 25)
  }, [])
  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
