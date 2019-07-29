import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import Pair from "./Pair";
import { fillPairs } from "./pairActions";

const Slice = ({ idx }) => {
  const dispatch = useDispatch();
  const slice = useSelector(state => state[idx]);
  useEffect(() => {
    //dispatch(fillPairs(idx));
  }, []);
  return (
    <ul className="list-group">
      {slice.map(pair => {
        return <Pair key={pair.id} sliceId={idx} pairId={pair.id} />;
      })}
    </ul>
  );
};
Slice.displayName = "Slice";

export default Slice;
