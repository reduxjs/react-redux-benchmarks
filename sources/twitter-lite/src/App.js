import React, { Component } from 'react';
import './App.css';
import TwitterLite from './TwitterLite'

import { createStore } from 'redux'
import { Provider } from 'react-redux'

const store = createStore(() => true)

class App extends Component {
  state = { thing: true }
  componentDidMount() {
    setInterval(() => this.setState(state => ({ thing: !state.thing })), 5)
  }

  render() {
    return (
      <Provider store={store}>
        {this.state.thing ? <TwitterLite /> : <div>nope</div> }
      </Provider>
    );
  }
}

export default App;
