import React from "react";
import "./App.css";
import { useTrackedState } from "react-redux";
import Slice from "./Slice";

const App = () => {
  const state = useTrackedState();
  const slices = Array(Object.keys(state).length).fill(0);
  return (
    <div className="row">
      {slices.map((slice, idx) => {
        return (
          <div className="col-lg-4" key={idx}>
            <Slice idx={idx} />
          </div>
        );
      })}
    </div>
  );
};

export default App;
