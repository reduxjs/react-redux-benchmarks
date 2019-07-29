import { configureStore } from "redux-starter-kit";
//import thunk from "redux-thunk";

import rootReducer from "./inputs";

export default function configureAppStore() {
  const store = configureStore({
    reducer: rootReducer
    //middleware: [thunk],
    //devTools: process.env.NODE_ENV !== "production"
  });

  return store;
}
