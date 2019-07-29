import React, { Component } from "react";
import { useSelector } from "react-redux";

const Counter = ({ idx }) => {
  const value = useSelector(state => state[idx]);
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
