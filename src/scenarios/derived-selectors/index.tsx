import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import { NUM_POSTS, NUM_USERS } from './constants'
import {
  rootReducer,
  updateScore,
  addComment,
  updateRole,
  nextCommentId,
} from './state'

import App from './App'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

let commentId = nextCommentId

const roles: Array<'admin' | 'user'> = ['admin', 'user']

const doRandomDispatch = () => {
  const roll = Math.random()
  if (roll < 0.6) {
    // 60% — update a random post's score
    const id = Math.floor(Math.random() * NUM_POSTS)
    store.dispatch(
      updateScore({ id, changes: { score: Math.floor(Math.random() * 101) } })
    )
  } else if (roll < 0.85) {
    // 25% — add a new comment
    store.dispatch(
      addComment({
        id: commentId,
        postId: Math.floor(Math.random() * NUM_POSTS),
        userId: Math.floor(Math.random() * NUM_USERS),
        text: `Comment ${commentId}`,
      })
    )
    commentId++
  } else {
    // 15% — update a random user's role
    const id = Math.floor(Math.random() * NUM_USERS)
    store.dispatch(updateRole({ id, role: roles[Math.floor(Math.random() * roles.length)] }))
  }
}

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(doRandomDispatch, 25)
  }, [])
  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
