import React, { useEffect } from "react";
import { useTrackedState, useDispatch } from "react-redux";

import { initialize, createStringId } from "./strings";
import { TEXT_INPUT_MOD } from "./constants";

const Counter = ({ idx }) => {
  const state = useTrackedState();
  const value = state.counters[idx];
  return <div>Value: {value}</div>;
};

Counter.displayName = "Counter";

const TextDisplay = ({ idx, inputId, children }) => {
  const dispatch = useDispatch();
  const state = useTrackedState();
  const stringId = createStringId(idx, inputId); //`${idx}-${remainingDepth}`;
  const text = state.strings[stringId] || "unknown";

  useEffect(() => {
    dispatch(initialize({ stringId }));
  }, []);

  return (
    <div>
      Text {stringId}:<br />
      <textarea value={text} />
      {children}
    </div>
  );
};
TextDisplay.displayName = "TextDisplay";

const Slice = ({ remainingDepth, idx }) => {
  if (remainingDepth > 0) {
    let renderedChild = (
      <div>
        {idx}.{remainingDepth}
        <div>
          <Slice idx={idx} remainingDepth={remainingDepth - 1} />
        </div>
      </div>
    );

    if (remainingDepth % TEXT_INPUT_MOD === 0) {
      renderedChild = (
        <TextDisplay
          idx={idx}
          inputId={remainingDepth / TEXT_INPUT_MOD}
        >
          {renderedChild}
        </TextDisplay>
      );
    }

    return renderedChild;
  }

  return <Counter idx={idx} />;
};
Slice.displayName = "Slice";

export default Slice;
