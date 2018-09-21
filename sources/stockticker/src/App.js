import React from 'react';
import {connect} from "react-redux";

import Slice from "./Slice";

const mapState  = (state) => ({  slices: Array(Object.keys(state).length).fill(0) });  // just to iterate using map in render

class App extends React.Component {
    render () {
        return (
            <div className='row'>
                {this.props.slices.map((slice, idx) => {
                    return (
                        <div className='col-lg-4' key={idx}>
                           <Slice idx={idx} />
                        </div>
                    )
                })}
            </div>
        )
    }
}

export default connect(mapState)(App);
