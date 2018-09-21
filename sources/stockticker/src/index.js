import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import 'fps-emit'

import {Provider} from "react-redux";

import configureStore from "./configureStore";
import SpecialContext from './SpecialContext'

const store = configureStore();

console.log(store);

ReactDOM.render(
    <Provider store={store} >
        <App />
    </Provider>,
    document.getElementById('root')
);

