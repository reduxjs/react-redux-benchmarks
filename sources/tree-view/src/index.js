import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import {
  configureStore,
} from '@acemarke/redux-starter-kit'
import seedrandom from "seedrandom";
import "fps-emit";

import reducer from './reducers'
import {doRandomAction} from "./actions";
import generateTree from './generateTree'
import Node from './containers/Node'

seedrandom("test seed", {global : true});

const tree = generateTree(5000);
const store = configureStore({
  reducer,
  preloadedState : tree,
});

render(
  <Provider store={store}>
    <Node id={0} />
  </Provider>,
  document.getElementById('root')
)


let maxUpdates = 2500, numUpdates = 0;

function runUpdates() {
  doRandomAction();
  numUpdates++;

  if(numUpdates < maxUpdates) {
    setTimeout(runUpdates, 25);
  }
}

setTimeout(runUpdates, 250);