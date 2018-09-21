import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import 'fps-emit'

import * as c from './constants';
import { updatePair } from './pairActions';

import {Provider} from "react-redux";

import configureStore from "./configureStore";
import SpecialContext from './SpecialContext'

const store = configureStore();

ReactDOM.render(
    <Provider store={store} >
        <App />
    </Provider>,
    document.getElementById('root')
);

function updateRandomPairInSlice() {
    const sliceId = Math.floor(Math.random() * c.NUMBER_OF_SLICES) + 1;
    const pairId = Math.floor(Math.random() * (c.NUM_ENTRIES / c.NUMBER_OF_SLICES)) + 1;
    store.dispatch(updatePair(sliceId, pairId));
}

setInterval(updateRandomPairInSlice, 13)

setInterval(updateRandomPairInSlice, 21)

setInterval(updateRandomPairInSlice, 34)

setInterval(updateRandomPairInSlice, 55)