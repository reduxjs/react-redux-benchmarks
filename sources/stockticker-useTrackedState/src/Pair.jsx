import React, { useEffect, useRef } from "react";
import { useTrackedState } from "react-redux";

const Pair = React.memo(({ sliceId, pairId }) => {
  const prevValue = useRef(null);
  const state = useTrackedState();
  const { name, value } = state[sliceId][pairId];
  const direction = value > prevValue.current ? "up" : "down";
  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  return (
    <li className="list-group-item">
      <span>{name}</span>
      <span
        className={
          "pull-right " +
          (direction === "up" ? "text-success" : "text-warning")
        }
      >
        <span
          className={
            "glyphicon " +
            (direction === "up"
              ? "glyphicon-arrow-up"
              : "glyphicon-arrow-down")
          }
        />
        <span>{value}</span>
      </span>
    </li>
  );
});
Pair.displayName = "Pair";

export default Pair;
