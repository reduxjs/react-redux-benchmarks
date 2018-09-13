import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'fps-emit';
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import App from './App';
import SpecialContext from './SpecialContext'

const store = createStore((state = [], action) => {
  if (action.type === 'tweet') {
    return [...state, action.tweet]
  }
  return state
})

ReactDOM.render(
  <Provider store={store}>
   <App />
  </Provider>,
  document.getElementById('root')
);
