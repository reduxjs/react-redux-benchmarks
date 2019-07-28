import React, { Component } from "react";
import { connect } from "react-redux";

import { initialize, createStringId } from "./strings";
import { TEXT_INPUT_MOD } from "./constants";

const counterMapState = (state, props) => {
  return {
    value: state.counters[props.idx]
  };
};

const Counter = ({ value }) => {
  return <div>Value: {value}</div>;
};

Counter.displayName = "Counter";

const ConnectedCounter = connect(counterMapState)(Counter);

const textMapState = (state, ownProps) => {
  const stringId = createStringId(ownProps.idx, ownProps.inputId); //`${ownProps.idx}-${ownProps.remainingDepth}`;
  const text = state.strings[stringId] || "unknown";

  return { text, stringId };
};

const textMapDispatch = { initialize };

class TextDisplay extends Component {
  componentDidMount() {
    const { stringId } = this.props;
    this.props.initialize({ stringId });
  }

  render() {
    const { text, stringId, children } = this.props;

    return (
      <div>
        Text {stringId}:<br />
        <textarea value={text} />
        {children}
      </div>
    );
  }
}
TextDisplay.displayName = "TextDisplay";

const ConnectedTextDisplay = connect(
  textMapState,
  textMapDispatch
)(TextDisplay);

class Slice extends Component {
  state = {};

  componentDidMount = () => {
    //this.props.fillPairs(this.props.idx);
  };

  render() {
    const { remainingDepth, idx } = this.props;

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
          <ConnectedTextDisplay
            idx={idx}
            inputId={remainingDepth / TEXT_INPUT_MOD}
          >
            {renderedChild}
          </ConnectedTextDisplay>
        );
      }

      return renderedChild;
    }

    return <ConnectedCounter idx={idx} />;
  }
}
Slice.displayName = "Slice";

export default Slice;
//export default connect(mapStateToProps, actions)(Slice);
