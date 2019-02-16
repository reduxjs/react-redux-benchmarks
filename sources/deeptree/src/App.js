import React from 'react';
import {connect} from "react-redux";

import Slice from "./Slice";
import {updateRandomPairInSlice} from "./pairActions";

let slices;

const mapState  = (state) => {
    if(!slices) {
        slices = Array(Object.keys(state).length).fill(0);
    }

    return {slices};
}

const mapDispatch = {updateRandomPairInSlice};

class App extends React.Component {
    render () {
        return (
          <div>
            <button onClick={this.props.updateRandomPairInSlice}>Update Random Pair</button>
            <div className='row'>
              {this.props.slices.map((slice, idx) => {
                return (
                  <div className='col-lg-4' key={idx}>
                    <Slice idx={idx} />
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
