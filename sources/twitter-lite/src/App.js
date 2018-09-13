import React, { Component } from 'react';
import './App.css';
import TwitterLite from './TwitterLite'
import SpecialContext from './SpecialContext'

import { connect } from 'react-redux'

class App extends Component {
  componentDidMount() {
    setInterval(() => this.props.tweet())
  }

  render() {
    return (
      <div>
        {this.props.tweets.map((tweet, i) => <TwitterLite tweet={tweet} />)}
      </div>
    );
  }
}

function tweet() {
  return { type: 'tweet', tweet: 'fabulous' }
}

export default connect(tweets => ({ tweets }), { tweet })(App);
