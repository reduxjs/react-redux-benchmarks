import React, { Component } from "react";
import { connect } from "react-redux";

import TwitterLite from "./TwitterLite";

const mapStateToProps = (state, props) => {
  return {
    slice: state[props.idx]
  };
};

class Slice extends Component {
  state = {};

  // componentDidMount = () => {
  //     this.props.fillPairs(this.props.idx);
  // }

  render() {
    const { slice, idx } = this.props;
    return (
      <ul className="list-group">
        {slice.map(tweet => {
          return <TwitterLite sliceId={idx} tweet={tweet} />;
        })}
      </ul>
    );
  }
}

export default connect(mapStateToProps)(Slice);
