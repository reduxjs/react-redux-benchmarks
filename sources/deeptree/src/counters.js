import { createSlice } from "redux-starter-kit";
import * as c from "./constants";

const { reducer, actions } = createSlice({
  initialState: {},
  reducers: {
    initialize(state, action) {
      const { numberOfCounters } = action.payload;
      for (let i = 0; i < numberOfCounters; i++) {
        state[i] = 0;
      }
    },
    increment(state, action) {
      const { counterId } = action.payload;
    },
    incrementMany(state, action) {
      const { mod } = action.payload;
      for (let counterId = 0; counterId < c.NUMBER_OF_SLICES; counterId++) {
        if (counterId % mod === 0) {
          const value = state[counterId] || 0;
          state[counterId] = value + 1;
        }
      }
    }
  }
});

export const { initialize, increment, incrementMany } = actions;

export function incrementRandomCounter() {
  const counterId = Math.floor(Math.random() * c.NUMBER_OF_SLICES);
  return increment({ counterId });
}

export default reducer;
