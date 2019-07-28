import React from "react";
import { connect } from "react-redux";

import Form from "./Form";
import * as c from "./constants";

import { typeTextInRandomInput } from "./inputs";

let slices;

const mapState = state => {
  if (!slices) {
    slices = Object.keys(state).map(key => Number(key));
    //slices.sort();
  }

  return { slices };
};

//const mapDispatch = { typeTextInRandomInput };

async function infiniteBobRoss() {
  while (true) {
    await typeTextInRandomInput();
  }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <button onClick={infiniteBobRoss}>Type Text</button>
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
