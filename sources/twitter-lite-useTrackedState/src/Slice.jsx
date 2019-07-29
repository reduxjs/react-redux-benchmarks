import React from "react";
import { useTrackedState } from "react-redux";

import TwitterLite from "./TwitterLite";

const mapStateToProps = (state, props) => {
  return {
    slice: state[props.idx]
  };
};

const Slice = React.memo(({ idx }) => {
  const state = useTrackedState();
  const slice = state[idx];
  return (
    <ul className="list-group">
      {slice.map(tweet => {
        return <TwitterLite sliceId={idx} tweet={tweet} />;
      })}
    </ul>
  );
});

export default Slice;
