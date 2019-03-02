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
    }
  }
});

export const { initialize, increment } = actions;

export function incrementRandomCounter() {
  const counterId = Math.floor(Math.random() * c.NUMBER_OF_SLICES);
  return increment({ counterId });
}

export default reducer;
