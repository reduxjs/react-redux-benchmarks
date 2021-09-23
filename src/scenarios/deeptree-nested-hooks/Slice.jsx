import React, { useEffect } from 'react'
import { shallowEqual, useSelector, useDispatch } from 'react-redux'

import { initialize, createStringId } from './strings'
import { TEXT_INPUT_MOD } from './constants'

const Counter = ({ idx }) => {
  const value = useSelector((state) => state.counters[idx])
  return <div>Value: {value}</div>
}

Counter.displayName = 'Counter'

const TextDisplay = ({ idx, inputId, children }) => {
  const dispatch = useDispatch()
  const stringId = createStringId(idx, inputId)
  const text = useSelector((state) => {
    //`${idx}-${remainingDepth}`;
    const text = state.strings[stringId] || 'unknown'
    return text
  })

  useEffect(() => {
    dispatch(initialize({ stringId }))
  }, [])

  return (
    <div>
      Text {stringId}:<br />
      <textarea value={text} />
      {children}
    </div>
  )
}
TextDisplay.displayName = 'TextDisplay'

const Slice = ({ remainingDepth, idx }) => {
  if (remainingDepth > 0) {
    let renderedChild = (
      <div>
        {idx}.{remainingDepth}
        <div>
          <Slice idx={idx} remainingDepth={remainingDepth - 1} />
        </div>
      </div>
    )

    if (remainingDepth % TEXT_INPUT_MOD === 0) {
      renderedChild = (
        <TextDisplay idx={idx} inputId={remainingDepth / TEXT_INPUT_MOD}>
          {renderedChild}
        </TextDisplay>
      )
    }

    return renderedChild
  }

  return <Counter idx={idx} />
}
Slice.displayName = 'Slice'

export default Slice
