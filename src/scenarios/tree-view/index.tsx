import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'
// @ts-ignore
import seedrandom from 'seedrandom'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'

import reducer, { increment, addChildNode, deleteNode } from './state'
import generateTree, { TreeState } from './generateTree'
import Node from './Node'

seedrandom('test seed', { global: true })

const tree = generateTree(5000)
const store = configureStore({
  reducer,
  preloadedState: tree,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

function getRandomNodeId(): string {
  const state = store.getState() as TreeState
  const keys = Object.keys(state)
  return keys[Math.floor(Math.random() * keys.length)]
}

function doRandomAction() {
  const roll = Math.random() * 100

  if (roll < 60) {
    // 60% increment
    store.dispatch(increment(getRandomNodeId()))
  } else if (roll < 90) {
    // 30% add child
    store.dispatch(addChildNode(getRandomNodeId()))
  } else {
    // 10% delete node (never delete root)
    const state = store.getState() as TreeState
    const keys = Object.keys(state).filter((k) => k !== '0')
    if (keys.length === 0) return
    const nodeId = keys[Math.floor(Math.random() * keys.length)]
    store.dispatch(deleteNode(nodeId))
  }
}

const TreeViewApp = () => {
  useLayoutEffect(() => {
    setInterval(doRandomAction, 25)
  }, [])

  return <Node id={0} />
}

// @ts-ignore
renderApp(TreeViewApp, store)
