import React from "react";
import { connect } from "react-redux";

import { updateInput } from "./inputs";

import * as c from "./constants";

const mapState = (state, ownProps) => {
  return {
    text: state[ownProps.id]
  };
};

const mapDispatch = { updateInput };

class Form extends React.Component {
  onChange = e => {
    this.props.updateInput({ inputId: this.props.id, text: e.target.value });
  };

  render() {
    const { text, id } = this.props;

    const fillers = Array.from({
      length: c.NUMBER_OF_CHECKBOXES_PER_FORM
    }).map((item, i) => <input type="checkbox" key={i} />);

    return (
      <React.Fragment>
        <form style={{ display: "flex", alignItems: "flex-start" }}>
          Form {id}:
          <textarea id={`input-${id}`} value={text} onChange={this.onChange} />
        </form>
        <div>{fillers}</div>
      </React.Fragment>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(Form);
