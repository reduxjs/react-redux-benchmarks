import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TreeState } from './generateTree'

let nextId = 0

const treeSlice = createSlice({
  name: 'tree',
  initialState: {} as TreeState,
  reducers: {
    increment(state, action: PayloadAction<number | string>) {
      const nodeId = action.payload
      state[nodeId].counter++
    },
    addChildNode: {
      reducer(
        state,
        action: PayloadAction<{
          parentId: number | string
          childId: string
        }>
      ) {
        const { parentId, childId } = action.payload
        state[childId] = {
          id: childId,
          counter: 0,
          parentId,
          childIds: [],
        }
        state[parentId].childIds.push(childId)
      },
      prepare(parentId: number | string) {
        return { payload: { parentId, childId: `new_${nextId++}` } }
      },
    },
    deleteNode(state, action: PayloadAction<number | string>) {
      const nodeId = action.payload
      const node = state[nodeId]
      if (!node) return

      // Remove from parent's childIds
      if (node.parentId !== null) {
        const parent = state[node.parentId]
        if (parent) {
          parent.childIds = parent.childIds.filter((id) => id !== nodeId)
        }
      }

      // Collect all descendants
      const toDelete: (number | string)[] = [nodeId]
      for (let i = 0; i < toDelete.length; i++) {
        const n = state[toDelete[i]]
        if (n) {
          toDelete.push(...n.childIds)
        }
      }

      // Delete all
      for (const id of toDelete) {
        delete state[id]
      }
    },
  },
})

export const { increment, addChildNode, deleteNode } = treeSlice.actions
export default treeSlice.reducer
