import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import {
  configureStore,
} from '@acemarke/redux-starter-kit'
import seedrandom from "seedrandom";

import reducer from './reducers'
import {increment} from "./actions";
import generateTree from './generateTree'
import Node from './containers/Node'

seedrandom("test seed", {global : true});

const tree = generateTree(10);
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
