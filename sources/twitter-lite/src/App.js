import React, { Component } from "react";
import "./App.css";
import { connect } from "react-redux";
import Slice from "./Slice";

const mapState = state => ({
  slices: Array(Object.keys(state).length).fill(0)
});

class App extends Component {
  render() {
    return (
      <div className="row">
        {this.props.slices.map((slice, idx) => {
          return (
            <div className="col-lg-4" key={idx}>
              <Slice idx={idx} />
            </div>
          );
        })}
      </div>
    );
  }
}

export default connect(mapState)(App);
