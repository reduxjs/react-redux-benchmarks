export default function generateTree(numNodes = 1000) {
  let tree = {
    0: {
      id: 0,
      counter: 0,
      childIds: []
    }
  };

  for (let i = 1; i < numNodes; i++) {
    let parentId = Math.floor(Math.pow(Math.random(), 2) * i);
    tree[i] = {
      id: i,
      counter: 0,
      childIds: []
    };
    tree[parentId].childIds.push(i);
  }

  return tree;
}
