import React from "react";
import { connect } from "react-redux";

import Slice from "./Slice";
import * as c from "./constants";
import { incrementMany, incrementRandomCounter } from "./counters";
import { appendRandomCharacter, appendRandomCharToMany } from "./strings";

let slices;

const mapState = state => {
  if (!slices) {
    slices = Array.from({ length: c.NUMBER_OF_SLICES }).map(
      (dummy, idx) => idx
    );
    //slices.sort();
  }

  return { slices };
};

function doUpdateMany(mod) {
  return incrementMany({ mod });
}

const mapDispatch = {
  incrementRandomCounter,
  incrementFifth: () => doUpdateMany(5),
  incrementThird: () => doUpdateMany(3),
  appendRandomCharacter,
  appendMany: () => appendRandomCharToMany(4)
};

class App extends React.Component {
  render() {
    return (
      <div>
        <div>
          <button
            id="incrementRandom"
            onClick={this.props.incrementRandomCounter}
          >
            Update Random Counter
          </button>
          <button id="incrementFifth" onClick={this.props.incrementFifth}>
            Update 1/5 Counters
          </button>
          <button id="incrementThird" onClick={this.props.incrementThird}>
            Update 1/3 Counters
          </button>
          <button
            id="appendRandomCharacter"
            onClick={this.props.appendRandomCharacter}
          >
            Append Random Char
          </button>
          <button id="appendMany" onClick={this.props.appendMany}>
            Append Char to Many
          </button>
        </div>
        <div className="row">
          {this.props.slices.map((slice, idx) => {
            return (
              <div style={{ display: "inline-block", minWidth: 70 }} key={idx}>
                <Slice idx={slice} remainingDepth={c.TREE_DEPTH} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
App.displayName = "App";

export default connect(
  mapState,
  mapDispatch
)(App);
