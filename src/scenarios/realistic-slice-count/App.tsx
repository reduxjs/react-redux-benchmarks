import React from 'react'
import { useSelector } from 'react-redux'

import { NUMBER_OF_COMPONENTS, NUMBER_OF_SLICES } from './constants'
import { getSliceName } from './state'
import type { RootState } from './state'

const createComponent = (index: number) => {
  const sliceName = getSliceName(index % NUMBER_OF_SLICES)
  const readsCounter = index % 3 !== 0

  return function Component() {
    const counter = useSelector((state: RootState) =>
      readsCounter
        ? state[sliceName].counter
        : state[sliceName].meta.updatedAt,
    )
    const enabled = useSelector(
      (state: RootState) => state[sliceName].settings.enabled,
    )

    return (
      <div>
        {counter}
        {enabled ? ' on' : ' off'}
      </div>
    )
  }
}

const components = Array.from({ length: NUMBER_OF_COMPONENTS }).map((_, index) =>
  createComponent(index),
)

function App() {
  return (
    <div>
      {components.map((Component, index) => (
        <Component key={index} />
      ))}
    </div>
  )
}

export default App
