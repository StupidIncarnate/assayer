// Empty proxy: the adapter parses a source string with the real TypeScript compiler API and answers a
// pure structural question about it — the parse IS the logic under test, so it runs real and there is
// no I/O to mock.
export const isAssayerHarnessGuardProxy = (): Record<PropertyKey, never> => ({});
