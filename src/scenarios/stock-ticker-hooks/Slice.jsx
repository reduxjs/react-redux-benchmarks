import React, { useLayoutEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Pair from './Pair'
import { fillPairs } from './pairActions'

function Slice({ idx }) {
  const slice = useSelector((state) => state[idx])
  const dispatch = useDispatch()

  useLayoutEffect(() => {
    dispatch(fillPairs(idx))
  }, [dispatch, idx])

  return (
    <ul className="list-group">
      {slice.map((pair) => {
        return <Pair key={pair.id} sliceId={idx} pairId={pair.id} />
      })}
    </ul>
  )
}

export default React.memo(Slice)
