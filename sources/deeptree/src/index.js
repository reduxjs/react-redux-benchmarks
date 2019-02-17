import React, {unstable_Profiler as Profiler} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import 'fps-emit'

import * as c from './constants';
//import { updatePair, updateRandomPairInSlice, fillPairs } from './pairActions';
import {initialize, incrementRandomCounter} from "./counters";

import {Provider} from "react-redux";

import configureStore from "./configureStore";

const store = configureStore();

store.dispatch(initialize({numberOfCounters: c.NUMBER_OF_SLICES}));

const renderResults = [];
window.renderResults = renderResults;


function onAppRendered(id, phase, actualTime, baseTime, startTime, commitTime, interactions = []) {
    if(!Array.isArray(interactions)) {
        interactions = [...interactions]
    }
    renderResults.push({id, phase, actualTime, baseTime, startTime, commitTime, interactions});
}

ReactDOM.render(
    <Profiler id="appProfiler" onRender={onAppRendered}>
        <Provider store={store} >
            <App />
        </Provider>
    </Profiler>,
    document.getElementById('root')
);

/*
function updateRandomPairInSlice() {
    const sliceId = Math.floor(Math.random() * c.NUMBER_OF_SLICES);
    const pairId = Math.floor(Math.random() * (c.NUM_ENTRIES / c.NUMBER_OF_SLICES));
    store.dispatch(updatePair(sliceId, pairId));
}
*/
function doRandomUpdate() {
  store.dispatch(incrementRandomCounter());
}

//setInterval(updateRandomPairInSlice, 500);


setInterval(doRandomUpdate, 13)

setInterval(doRandomUpdate, 21)

setInterval(doRandomUpdate, 34)

setInterval(doRandomUpdate, 55)

