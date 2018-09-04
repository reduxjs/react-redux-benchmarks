import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import React, { Component } from 'react';

const exampleMapStateToProps = createSelector(
  (state, props) => 'foobar',
  (foo) => ({ foo })
);

const foobar = () => {};
const exampleMapDispatchToProps = { foobar };

class Internal extends Component {
  render() {
    return <div>barfoo</div>;
  }
}

class InternalContainer extends Component {
  render() {
    return <Internal />;
  }
}

const InternalContainerConnected = connect(exampleMapStateToProps, exampleMapDispatchToProps)(
  InternalContainer
);

class Example extends Component {
  render() {
    return <InternalContainerConnected />;
  }
}

class ExampleContainer extends Component {
  render() {
    return <Example />;
  }
}

export default connect(exampleMapStateToProps, exampleMapDispatchToProps)(ExampleContainer);