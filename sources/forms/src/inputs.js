import { createSlice } from "redux-starter-kit";
import * as c from "./constants";
import userEvent from "user-event";

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

const BOB_ROSS_IPSUM = `
Little short strokes. And I know you're saying, 'Oh Bob, you've done it this 
time.' And you may be right. You can do anything here. So don't worry about it. 
Even the worst thing we can do here is good. Absolutely no pressure. You are 
just a whisper floating across a mountain. Isn't that fantastic that you can 
create an almighty tree that fast?
`.trim();

export function typeTextInRandomInput() {
  const inputId = Math.floor(Math.random() * c.NUMBER_OF_INPUTS);

  const input = document.getElementById(`input-${inputId}`);

  return userEvent.type(input, BOB_ROSS_IPSUM, { delay: 25 });
}

export default reducer;
