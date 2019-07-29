import React from "react";
import { useTrackedState } from "react-redux";

import Form from "./Form";
import * as c from "./constants";

import { typeTextInRandomInput } from "./inputs";

let slicesNaiveCache;

//const mapDispatch = { typeTextInRandomInput };

async function infiniteBobRoss() {
  while (true) {
    await typeTextInRandomInput();
  }
}

const App = () => {
  const state = useTrackedState();
  if (!slicesNaiveCache) {
    slicesNaiveCache = Object.keys(state).map(key => Number(key));
    //slicesNaiveCache.sort();
  }
  const slices = slicesNaiveCache;
  render() {
    return (
      <div>
        <button onClick={infiniteBobRoss}>Type Text</button>
        <div className="row">
          {slices.map((slice, idx) => {
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

export default App;
