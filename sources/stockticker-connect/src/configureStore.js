import { applyMiddleware, compose, createStore } from "redux";
import { unstable_trace as trace } from "scheduler/tracing";

import rootReducer from "./pairsReducer";
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === "function") {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const reactProfilerMiddleware = store => next => action => {
  const { type } = action;
  return trace(`[redux] ${type}`, performance.now(), () => next(action));
};

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default function configureStore(preloadedState) {
  const middlewares = [thunk];
  const middlewareEnhancer = applyMiddleware(...middlewares);

  const enhancers = [middlewareEnhancer];
  const composedEnhancers = composeEnhancers(...enhancers);

  const store = createStore(rootReducer, preloadedState, composedEnhancers);

  return store;
}
