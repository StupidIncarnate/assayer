
// The adapter parses real harness source through a real hermetic ts-morph project — exactly the
// resolution logic the tests must validate — so nothing is mocked; the child layer runs real too.
export const harnessValueTypesTransformerProxy = (): Record<PropertyKey, never> => {

  return {};
};
