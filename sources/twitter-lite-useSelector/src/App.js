import React from "react";
import "./App.css";
import { useSelector } from "react-redux";
import Slice from "./Slice";

const App = () => {
  const slices = useSelector(state => Array(Object.keys(state).length).fill(0));
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
