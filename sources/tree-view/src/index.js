import React, {unstable_Profiler as Profiler} from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import {
  configureStore,
} from '@acemarke/redux-starter-kit'
import seedrandom from "seedrandom";
import "fps-emit";

import reducer from './reducers'
import {doRandomAction} from "./actions";
import generateTree from './generateTree'
import Node from './containers/Node'

seedrandom("test seed", {global : true});

const tree = generateTree(5000);
const store = configureStore({
  reducer,
  preloadedState : tree,
});

const renderResults = [];
window.renderResults = renderResults;


function onAppRendered(id, phase, actualTime, baseTime, startTime, commitTime, interactions = []) {
    if(!Array.isArray(interactions)) {
        interactions = [...interactions]
    }
    renderResults.push({id, phase, actualTime, baseTime, startTime, commitTime, interactions});
}

render(
    <Profiler id="appProfiler" onRender={onAppRendered}>
  <Provider store={store}>
    <Node id={0} />
  </Provider>
    </Profiler>,
  document.getElementById('root')
)


let maxUpdates = 3500, numUpdates = 0;

function runUpdates() {
  doRandomAction();
  numUpdates++;

  if(numUpdates < maxUpdates) {
    setTimeout(runUpdates, 25);
  }
}

setTimeout(runUpdates, 250);