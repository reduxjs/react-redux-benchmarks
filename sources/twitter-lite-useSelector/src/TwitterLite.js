import { shallowEqual, useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import React,  from "react";

const exampleMapStateToProps = createSelector(
  (state, props) => "foobar",
  foo => ({ foo })
);

const foobar = () => {};
const exampleMapDispatchToProps = { foobar };

const InternalContainer = React.memo((props) => {
  const dispatch = useDispatch();
  const { foo } = useSelector(state => exampleMapStateToProps(state, props), shallowEqual);
  const actionFoobar = () => dispatch(foobar());
  return <Internal />;
});

const Example = () => {
  return <InternalContainer />;
};

const ExampleContainer = React.memo((props) => {
  const state = useReduxState();
  const dispatch = useReduxDispatch();
  const { foo } = exampleMapStateToProps(state, props);
  const actionFoobar = () => dispatch(foobar());
  return <Example />;
});

export default ExampleContainer;
