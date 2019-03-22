import { configureStore } from "redux-starter-kit";

import countersReducer from "./counters";
import stringsReducer from "./strings";

export default function configureAppStore() {
  const store = configureStore({
    reducer: {
      counters: countersReducer,
      strings: stringsReducer
    }
  });

  return store;
}
