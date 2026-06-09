import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import userEvent from '@testing-library/user-event'
import * as c from './constants'

type FormsState = Record<number, string>

const inputsSlice = createSlice({
  initialState: {} as FormsState,
  name: 'inputs',
  reducers: {
    initialize(state, action: PayloadAction<{ numberOfInputs: number }>) {
      const { numberOfInputs } = action.payload
      for (let i = 0; i < numberOfInputs; i++) {
        state[i] = ''
      }
    },
    updateInput(
      state,
      action: PayloadAction<{ inputId: number; text: string }>
    ) {
      const { inputId, text } = action.payload
      state[inputId] = text
    },
  },
})

export const { initialize, updateInput } = inputsSlice.actions

const BOB_ROSS_IPSUM = `
Little short strokes. And I know you're saying, 'Oh Bob, you've done it this 
time.' And you may be right. You can do anything here. So don't worry about it. 
Even the worst thing we can do here is good. Absolutely no pressure. You are 
just a whisper floating across a mountain. Isn't that fantastic that you can 
create an almighty tree that fast?
`.trim()

export function typeTextInRandomInput() {
  const inputId = Math.floor(Math.random() * c.NUMBER_OF_INPUTS)
  console.log('Input id: ', inputId)

  const input = document.getElementById(`input-${inputId}`)!

  return userEvent.type(input, BOB_ROSS_IPSUM, { delay: 25 })
}

export default inputsSlice.reducer
