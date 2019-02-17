import React, { Component } from 'react';
import { connect } from 'react-redux';


const mapStateToProps = (state, props) => {
    return {
        value: state[props.idx]
    }
}

const Counter = ({value}) => {
    return <div>Value: {value}</div>
}

const ConnectedCounter = connect(mapStateToProps)(Counter);


class Slice extends Component {
    state = {};

    componentDidMount = () => {
        //this.props.fillPairs(this.props.idx);
    }

    render() {
        const { remainingDepth, idx } = this.props;

        if(remainingDepth > 0) {
            return (
                <div>
                    {idx}.{remainingDepth}
                    <div>
                        <Slice idx={idx} remainingDepth={remainingDepth - 1} />
                    </div>
                </div>
            )
        }

        return (
            <ConnectedCounter idx={idx} />
        );
    }
}
Slice.displayName = "Slice";


export default Slice
//export default connect(mapStateToProps, actions)(Slice);