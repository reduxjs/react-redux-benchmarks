import React from 'react'
import { api, useSomeQuery } from './api'
import { useDispatch } from 'react-redux'

export function Child({ arg, skip }: { arg: string; skip: boolean }) {
  const result = useSomeQuery(arg, { skip })
  return (
    <div>
      {result.isUninitialized
        ? 'uninitialized'
        : result.isLoading
        ? 'isLoading'
        : `${result.data} ${result.isFetching ? '(fetching)' : ''}`}
    </div>
  )
}

export const Invalidate = () => {
  const dispatch = useDispatch()
  return (
    <button onClick={() => dispatch(api.util.invalidateTags(['QUERY']))}>
      invalidate
    </button>
  )
}
