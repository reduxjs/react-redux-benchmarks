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

function clickButton(id) {
  const element = document.getElementById(id);

  if (element) {
    element.click();
  }
}

const MULTIPLIER = 2;

setInterval(() => clickButton("incrementRandom"), 13 * MULTIPLIER);
setInterval(() => clickButton("appendRandomCharacter"), 37 * MULTIPLIER);
setInterval(() => clickButton("incrementFifth"), 103 * MULTIPLIER);
setInterval(() => clickButton("incrementThird"), 193 * MULTIPLIER);
setInterval(() => clickButton("appendMany"), 251 * MULTIPLIER);
