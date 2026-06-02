import React from 'react'
import { useSelector } from 'react-redux'
import { selectIds, selectById } from './state'
import type { RootState } from './state'

const ItemRow = React.memo(function ItemRow({ id }: { id: number }) {
  const item = useSelector((state: RootState) => selectById(state, id))
  if (!item) return null
  return (
    <div>
      {item.label}: {item.value}
    </div>
  )
})

export function ItemList() {
  const ids = useSelector(selectIds)
  return (
    <div>
      {ids.map((id) => (
        <ItemRow key={id} id={id as number} />
      ))}
    </div>
  )
}
