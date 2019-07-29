import React from "react";
import { useTrackedState, useDispatch } from "react-redux";

import Slice from "./Slice";
import * as c from "./constants";
import { incrementMany, incrementRandomCounter } from "./counters";
import { appendRandomCharacter, appendRandomCharToMany } from "./strings";

let slicesNaiveCache;

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

const App = () => {
  const dispatch = useDispatch();
  const state = useTrackedState();
  if (!slicesNaiveCache) {
    slicesNaiveCache = Array.from({ length: c.NUMBER_OF_SLICES }).map(
      (dummy, idx) => idx
    );
    //slicesNaiveCache.sort();
  }
  const slices = slicesNaiveCache;
  const actionIncrementRandomCounter = () => {
    dispatch(incrementRandomCounter());
  };
  const actionIncrementFifth = () => {
    dispatch(incrementMany({ mod: 5 }));
  };
  const actionIncrementThird = () => {
    dispatch(incrementMany({ mod: 3 }));
  };
  const actionAppendRandomCharacter = () => {
    dispatch(appendRandomCharacter());
  };
  const actionAppendMany = () => {
    dispatch(appendRandomCharToMany(4));
  };
  return (
    <div>
      <div>
        <button
          id="incrementRandom"
          onClick={actionIncrementRandomCounter}
        >
          Update Random Counter
        </button>
        <button id="incrementFifth" onClick={actionIncrementFifth}>
          Update 1/5 Counters
        </button>
        <button id="incrementThird" onClick={actionIncrementThird}>
          Update 1/3 Counters
        </button>
        <button
          id="appendRandomCharacter"
          onClick={actionAppendRandomCharacter}
        >
          Append Random Char
        </button>
        <button id="appendMany" onClick={actionAppendMany}>
          Append Char to Many
        </button>
      </div>
      <div className="row">
        {slices.map((slice, idx) => {
          return (
            <div style={{ display: "inline-block", minWidth: 70 }} key={idx}>
              <Slice idx={slice} remainingDepth={c.TREE_DEPTH} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
App.displayName = "App";

export default App;
