import React, { Component } from 'react';
import { connect } from 'react-redux';

import Pair from "./Pair";
import { fillPairs } from "./pairActions";

const actions = { fillPairs };

const mapStateToProps = (state, props) => {
    return {
        slice: state[props.idx]
    }
}


class Slice extends Component {
    state = {};

    componentDidMount = () => {
        this.props.fillPairs(this.props.idx);
    }

    render() {
        const { slice, idx } = this.props;
        return (
            <ul className='list-group'>
                {slice.map((pair) => {
                    return (
                        <Pair key={pair.id} sliceId={idx} pairId={pair.id} />
                    )
                })}
            </ul>
        );
    }
}
Slice.displayName = "Slice";

export default connect(mapStateToProps, actions)(Slice);