export function assert(condition, msg = 'Assertion failed!') {
  if (!condition) {
    console.error(msg);
    throw new Error(msg);
  }
}