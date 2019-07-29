import React from "react";
import { useTrackedState, useDispatch } from "react-redux";

import Slice from "./Slice";
import { updateRandomPairInSlice } from "./pairActions";

let slicesNaiveCache;

const App = () => {
  const dispatch = useDispatch();
  const updateRandomPair = () => dispatch(updateRandomPairInSlice());
  const state = useTrackedState();
  if (!slicesNaiveCache) {
    slicesNaiveCache = Array(Object.keys(state).length).fill(0);
  }
  const slices = slicesNaiveCache;
  return (
    <div>
      <button onClick={updateRandomPair}>
        Update Random Pair
      </button>
      <div className="row">
        {slices.map((slice, idx) => {
          return (
            <div className="col-lg-4" key={idx}>
              <Slice idx={idx} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
App.displayName = "App";

export default App;
