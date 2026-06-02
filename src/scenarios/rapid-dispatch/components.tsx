import React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from './state'

export const ItemStatus = React.memo(function ItemStatus({
  itemId,
}: {
  itemId: number
}) {
  const item = useSelector((state: RootState) => state.items.list[itemId])
  return (
    <div>
      #{item.id} {item.status} ({item.value})
    </div>
  )
})

export const CounterView = React.memo(function CounterView() {
  const total = useSelector((state: RootState) => state.counters.total)
  return <div>Total: {total}</div>
})

export const LastUpdated = React.memo(function LastUpdated() {
  const lastUpdated = useSelector(
    (state: RootState) => state.items.lastUpdated
  )
  return <div>Updated: {lastUpdated}</div>
})

export const LogCount = React.memo(function LogCount() {
  const count = useSelector((state: RootState) => state.log.count)
  return <div>Logs: {count}</div>
})
