import React, { useState } from 'react'
import { useSelector } from 'react-redux'

function Pair({ sliceId, pairId }) {
  const [direction, setDirection] = useState('up')
  const [stateValue, setStateValue] = useState(null)
  const { value, name } = useSelector((state) => state[sliceId][pairId])

  if (value !== stateValue) {
    const direction = value > stateValue ? 'up' : 'down'
    setDirection(direction)
    setStateValue(value)
  }

  return (
    <li className="list-group-item">
      <span>{name}</span>
      <span
        className={
          'pull-right ' + (direction === 'up' ? 'text-success' : 'text-warning')
        }
      >
        <span
          className={
            'glyphicon ' +
            (direction === 'up' ? 'glyphicon-arrow-up' : 'glyphicon-arrow-down')
          }
        />
        <span>{value}</span>
      </span>
    </li>
  )
}

export default React.memo(Pair, (prev, current) => true)
