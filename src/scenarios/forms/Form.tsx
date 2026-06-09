import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { updateInput } from './inputs'
import * as c from './constants'

interface FormProps {
  id: number
}

const Form = ({ id }: FormProps) => {
  const text = useSelector((state: Record<number, string>) => state[id])
  const dispatch = useDispatch()

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch(updateInput({ inputId: id, text: e.target.value }))
    },
    [dispatch, id]
  )

  const fillers = Array.from({
    length: c.NUMBER_OF_CHECKBOXES_PER_FORM,
  }).map((_, i) => <input type="checkbox" key={i} />)

  return (
    <>
      <form style={{ display: 'flex', alignItems: 'flex-start' }}>
        Form {id}:
        <textarea id={`input-${id}`} value={text} onChange={onChange} />
      </form>
      <div>{fillers}</div>
    </>
  )
}

export default React.memo(Form)
