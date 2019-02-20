import React from "react";
import { connect } from "react-redux";

import Form from "./Form";
import * as c from "./constants";

let slices;

const mapState = state => {
  if (!slices) {
    slices = Object.keys(state).map(key => Number(key));
    slices.sort();
  }

  return { slices };
};

class App extends React.Component {
  render() {
    return (
      <div>
        <button>Update Random Counter</button>
        <div className="row">
          {this.props.slices.map((slice, idx) => {
            return (
              <div style={{ display: "inline-block", minWidth: 70 }} key={idx}>
                <Form id={slice} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
App.displayName = "App";

export default connect(mapState)(App);
