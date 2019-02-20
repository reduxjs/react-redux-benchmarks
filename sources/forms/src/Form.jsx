import React from "react";
import { connect } from "react-redux";

import { updateInput } from "./inputs";

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

    return (
      <form>
        Form {id}:
        <input type="text" value={text} onChange={this.onChange} />
      </form>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(Form);
