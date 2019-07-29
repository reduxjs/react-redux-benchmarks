import React, { Component } from "react";
import { useTrackedState } from "react-redux";

const Counter = ({ idx }) => {
  const state = useTrackedState();
  const value = state[idx];
  return <div>Value: {value}</div>;
};

const Slice = ({ remainingDepth, idx }) => {
  if (remainingDepth > 0) {
    return (
      <div>
        {idx}.{remainingDepth}
        <div>
          <Slice idx={idx} remainingDepth={remainingDepth - 1} />
        </div>
      </div>
    );
  }

  return <Counter idx={idx} />;
};
Slice.displayName = "Slice";

export default Slice;
