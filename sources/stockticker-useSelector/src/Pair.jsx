import React, { useEffect, useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

const Pair = ({ sliceId, pairId }) => {
  const prevValue = useRef(null);
  const { name, value, direction } = useSelector(state => {
    const pair = state[sliceId][pairId];
    return {
      name: pair.name,
      value: pair.value,
      direction: pair.value > prevValue.current ? "up" : "down";
    };
  }, shallowEqual);
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
};
Pair.displayName = "Pair";

export default Pair;
