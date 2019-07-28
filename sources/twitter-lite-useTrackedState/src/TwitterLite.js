import { useTrackedState, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import React from "react";

const exampleMapStateToProps = createSelector(
  (state, props) => "foobar",
  foo => ({ foo })
);

const foobar = () => {};
const exampleMapDispatchToProps = { foobar };

const Internal = () => {
  return <div>barfoo</div>;
};

const InternalContainer = React.memo((props) => {
  const dispatch = useDispatch();
  const state = useTrackedState();
  const { foo } = exampleMapStateToProps(state, props);
  const actionFoobar = () => dispatch(foobar());
  return <Internal />;
});

const Example = () => {
  return <InternalContainer />;
};

const ExampleContainer = React.memo((props) => {
  const dispatch = useDispatch();
  const state = useTrackedState();
  const { foo } = exampleMapStateToProps(state, props);
  const actionFoobar = () => dispatch(foobar());
  return <Example />;
});

export default ExampleContainer;
