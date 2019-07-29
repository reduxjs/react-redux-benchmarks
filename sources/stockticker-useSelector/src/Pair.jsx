import React, { useEffect, useRef } from "react";
import { shallowEqual, useSelector } from "react-redux";

const naiveShallowObjEqual = (a, b) => {
  // reactive-react-redux doesn't export shallowEqual
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
};

const Pair = React.memo(({ sliceId, pairId }) => {
  const prevValue = useRef(null);
  const { name, value } = useSelector(state => state[sliceId][pairId], shallowEqual || naiveShallowObjEqual);
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
