export const INCREMENT = 'INCREMENT'
export const CREATE_NODE = 'CREATE_NODE'
export const DELETE_NODE = 'DELETE_NODE'
export const ADD_CHILD = 'ADD_CHILD'
export const REMOVE_CHILD = 'REMOVE_CHILD'

export const increment = (nodeId) => ({
  type: INCREMENT,
  nodeId
})

let nextId = 0
export const createNode = () => ({
  type: CREATE_NODE,
  nodeId: `new_${nextId++}`
})

export const deleteNode = (nodeId) => ({
  type: DELETE_NODE,
  nodeId
})

export const addChild = (nodeId, childId) => ({
  type: ADD_CHILD,
  nodeId,
  childId
})

export const removeChild = (nodeId, childId) => ({
  type: REMOVE_CHILD,
  nodeId,
  childId
})

function randomInteger(exclusiveMax) {
  return Math.floor(Math.random() * exclusiveMax);
}

function getRandomElement(selector) {
  const elements = document.querySelectorAll(selector);
  const randomIndex = randomInteger(elements.length);
  const element = elements[randomIndex];
  return element;
}

function clickIncrement() {
  const incrementButton = getRandomElement(".increment");
  incrementButton.click();
}

function clickAddChild() {
  const addChildButton = getRandomElement(".addChild");
  addChildButton.click();
}

function clickDeleteNode() {
  const deleteNodeButton = getRandomElement(".deleteNode");
  deleteNodeButton.click();
}

const odds = [
  {action : clickIncrement, percent : 60},
  {action : clickAddChild, percent : 20},
  {action : clickDeleteNode, percent : 20}
];

export function doRandomAction() {
  const randomPercentage = randomInteger(100);

  let currentPercentage = 0;
  for(let entry of odds) {
    currentPercentage += entry.percent;

    if(randomPercentage < currentPercentage) {
      entry.action();
      break;
    }
  }
}