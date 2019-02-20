import { createSlice } from "redux-starter-kit";
import * as c from "./constants";

const { reducer, actions } = createSlice({
  initialState: {},
  reducers: {
    initialize(state, action) {
      const { numberOfInputs } = action.payload;
      for (let i = 0; i < numberOfInputs; i++) {
        state[i] = "";
      }
    },
    updateInput(state, action) {
      const { inputId, text } = action.payload;
      state[inputId] = text;
    }
  }
});

export const { initialize, updateInput } = actions;

export default reducer;
