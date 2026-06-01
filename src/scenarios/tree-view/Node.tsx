import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { increment, addChildNode, deleteNode } from './state'
import { TreeState } from './generateTree'

interface NodeProps {
  id: number | string
}

const Node = ({ id }: NodeProps) => {
  const node = useSelector((state: TreeState) => state[id])
  const dispatch = useDispatch()

  const handleIncrementClick = useCallback(() => {
    dispatch(increment(id))
  }, [dispatch, id])

  const handleAddChildClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dispatch(addChildNode(id))
    },
    [dispatch, id]
  )

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dispatch(deleteNode(id))
    },
    [dispatch, id]
  )

  if (!node) return null

  const { counter, parentId, childIds } = node

  return (
    <div>
      Counter #{id}: {counter}{' '}
      <button className="increment" onClick={handleIncrementClick}>
        +
      </button>{' '}
      {parentId !== null && (
        <a
          href="#"
          className="deleteNode"
          onClick={handleRemoveClick}
          style={{ color: 'lightgray', textDecoration: 'none' }}
        >
          Delete
        </a>
      )}
      <ul>
        {childIds.map((childId) => (
          <li key={childId}>
            <Node id={childId} />
          </li>
        ))}
        <li key="add">
          <a href="#" className="addChild" onClick={handleAddChildClick}>
            Add child
          </a>
        </li>
      </ul>
    </div>
  )
}

export default React.memo(Node)
