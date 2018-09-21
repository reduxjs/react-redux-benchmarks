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

    // simulate = () => {
    //     const { idx } = this.props;
    //     setInterval(() => this.props.updatePair(idx), 13)

    //     setInterval(() => this.props.updatePair(idx), 21)

    //     setInterval(() => this.props.updatePair(idx), 34)

    //     setInterval(() => this.props.updatePair(idx), 55)
    // }

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

export default connect(mapStateToProps, actions)(Slice);