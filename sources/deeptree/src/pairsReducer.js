import { combineReducers } from 'redux';
import * as c from './constants'


const initialState = []

const highOrderSliceReducer = (sliceId = '') => (state = initialState, action) => {
  switch (action.type) {
    case `${c.FILL_PAIRS}_${sliceId}`: {
      return [...action.pairs];
    }
    case `${c.UPDATE_PAIR}_${sliceId}`: {
      return state.map(pair => {
        return pair.id === action.id
          ? {...pair, value: action.value }
          : pair
      })
    }
    default: {
      return state
    }
  }
}

const reducers = Array(c.NUMBER_OF_SLICES).fill(0).reduce((acc, curr, i) => {
  acc[i] = highOrderSliceReducer(i);
  return acc;
}, {});

export default combineReducers(reducers);
