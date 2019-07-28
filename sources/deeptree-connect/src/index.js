import React, { unstable_Profiler as Profiler } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import "fps-emit";

import * as c from "./constants";
import { initialize, incrementRandomCounter, incrementMany } from "./counters";

import { Provider } from "react-redux";

import configureStore from "./configureStore";

const store = configureStore();

store.dispatch(initialize({ numberOfCounters: c.NUMBER_OF_SLICES }));

const renderResults = [];
window.renderResults = renderResults;

function onAppRendered(
  id,
  phase,
  actualTime,
  baseTime,
  startTime,
  commitTime,
  interactions = []
) {
  if (!Array.isArray(interactions)) {
    interactions = [...interactions];
  }
  renderResults.push({
    id,
    phase,
    actualTime,
    baseTime,
    startTime,
    commitTime,
    interactions
  });
}

ReactDOM.render(
  <Profiler id="appProfiler" onRender={onAppRendered}>
    <Provider store={store}>
      <App />
    </Provider>
  </Profiler>,
  document.getElementById("root")
);

function doRandomUpdate() {
  store.dispatch(incrementRandomCounter());
}

function doUpdateMany(mod) {
  store.dispatch(incrementMany({ mod }));
}

setInterval(doRandomUpdate, 13);

setInterval(() => doUpdateMany(5), 21);

setInterval(doRandomUpdate, 34);

setInterval(() => doUpdateMany(3), 55);
