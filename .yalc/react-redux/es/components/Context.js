import { createContext, version as ReactVersion } from 'react';
const ContextKey = Symbol.for(`react-redux-context-${ReactVersion}`);
const gT = globalThis;

function getContext() {
  let realContext = gT[ContextKey];

  if (!realContext) {
    realContext = createContext(null);

    if (process.env.NODE_ENV !== 'production') {
      realContext.displayName = 'ReactRedux';
    }

    gT[ContextKey] = realContext;
  }

  return realContext;
}

export const ReactReduxContext = /*#__PURE__*/new Proxy({}, /*#__PURE__*/new Proxy({}, {
  get(_, handler) {
    const target = getContext(); // @ts-ignore

    return (_target, ...args) => Reflect[handler](target, ...args);
  }

}));
export default ReactReduxContext;