import React from 'react';
import {connect} from "react-redux";

import Slice from "./Slice";
import * as c from "./constants";
import {incrementRandomCounter} from "./counters";

let slices;

const mapState  = (state) => {
    if(!slices) {
        slices = Object.keys(state).map(key => Number(key))
        slices.sort()
    }

    return {slices};
}

const mapDispatch = {incrementRandomCounter};

class App extends React.Component {
    render () {
        return (
          <div>
            <button onClick={this.props.incrementRandomCounter}>Update Random Counter</button>
            <div className='row'>
              {this.props.slices.map((slice, idx) => {
                return (
                  <div style={{display: "inline-block", minWidth : 70}} key={idx}>
                    <Slice idx={slice} remainingDepth={c.TREE_DEPTH}/>
                  </div>
                )
              })}
            </div>
          </div>

        )
    }
}
App.displayName = "App";

export default connect(mapState, mapDispatch)(App);
