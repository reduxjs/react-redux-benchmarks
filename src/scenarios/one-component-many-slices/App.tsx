import React from 'react'
import { useSelector } from 'react-redux'

import { firstSliceName } from './state'
import type { RootState } from './state'

function Component() {
  const counter = useSelector((state: RootState) => {
    return state[firstSliceName].counter
  })

  return <div>{counter}</div>
}

function App() {
  return (
    <div>
      <Component />
    </div>
  )
}

export default App
