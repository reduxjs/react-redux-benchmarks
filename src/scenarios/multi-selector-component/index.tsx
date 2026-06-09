import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import {
  rootReducer,
  incrementLoginCount,
  touch,
  incrementUnread,
  updateRandomItem,
  updateScrollPosition,
} from './state'
import { NUM_DATA_ITEMS } from './constants'
import App from './App'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

function doRandomDispatch() {
  const roll = Math.random() * 100

  if (roll < 20) {
    // 20% — changes loginCount, NOT role → 0 re-renders
    store.dispatch(incrementLoginCount())
  } else if (roll < 40) {
    // 20% — changes updatedAt → 0 re-renders (no component selects preferences)
    store.dispatch(touch())
  } else if (roll < 60) {
    // 20% — changes unreadCount → all 1000 re-render
    store.dispatch(incrementUnread())
  } else if (roll < 80) {
    // 20% — changes one item's value → ~1 component re-renders
    const id = Math.floor(Math.random() * NUM_DATA_ITEMS)
    store.dispatch(updateRandomItem(id))
  } else {
    // 20% — changes scrollPosition, NOT sidebarOpen/activeTab → 0 re-renders
    store.dispatch(updateScrollPosition())
  }
}

const MultiSelectorApp = () => {
  useLayoutEffect(() => {
    setInterval(doRandomDispatch, 25)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(MultiSelectorApp, store)
