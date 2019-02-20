import { configureStore } from "redux-starter-kit";

import rootReducer from "./inputs";

export default function configureAppStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: [],
    devTools: process.env.NODE_ENV !== "production"
  });

  return store;
}
