import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import {
  configureStore,
} from '@acemarke/redux-starter-kit'

import reducer from './reducers'
import generateTree from './generateTree'
import Node from './containers/Node'

const tree = generateTree()
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
