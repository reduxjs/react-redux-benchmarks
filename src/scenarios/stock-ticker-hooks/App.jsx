import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import Slice from './Slice'
import { updateRandomPairInSlice } from './pairActions'

let savedSlices

function App() {
  const slices = useSelector((state) => {
    if (!savedSlices) {
      savedSlices = Array(Object.keys(state).length).fill(0)
    }

    return savedSlices
  })

  const dispatch = useDispatch()

  return (
    <div>
      <button onClick={() => dispatch(updateRandomPairInSlice())}>
        Update Random Pair
      </button>
      <div className="row">
        {slices.map((slice, idx) => {
          return (
            <div className="col-lg-4" key={idx}>
              <Slice idx={idx} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
