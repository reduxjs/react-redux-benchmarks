import { shallowEqual, useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import React from "react";

const naiveShallowObjEqual = (a, b) => {
  // reactive-react-redux doesn't export shallowEqual
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
};

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
  const { foo } = useSelector(state => exampleMapStateToProps(state, props), shallowEqual || naiveShallowObjEqual);
  const actionFoobar = () => dispatch(foobar());
  return <Internal />;
});

const Example = () => {
  return <InternalContainer />;
};

const ExampleContainer = React.memo((props) => {
  const dispatch = useDispatch();
  const { foo } = useSelector(state => exampleMapStateToProps(state, props), shallowEqual || naiveShallowObjEqual);
  const actionFoobar = () => dispatch(foobar());
  return <Example />;
});

export default ExampleContainer;
