export interface TreeNode {
  id: number | string
  counter: number
  parentId: number | string | null
  childIds: (number | string)[]
}

export type TreeState = Record<number | string, TreeNode>

export default function generateTree(numNodes = 1000): TreeState {
  const tree: TreeState = {
    0: {
      id: 0,
      counter: 0,
      parentId: null,
      childIds: [],
    },
  }

  for (let i = 1; i < numNodes; i++) {
    const parentId = Math.floor(Math.pow(Math.random(), 2) * i)
    tree[i] = {
      id: i,
      counter: 0,
      parentId,
      childIds: [],
    }
    tree[parentId].childIds.push(i)
  }

  return tree
}
