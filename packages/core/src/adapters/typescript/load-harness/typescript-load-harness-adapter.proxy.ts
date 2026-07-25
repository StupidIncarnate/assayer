// Empty proxy: the adapter transpiles a source string and evaluates it in its own throwaway vm context.
// Both halves ARE the logic under test — a stubbed transpile or a stubbed evaluation would prove a
// declaration nobody registered — and the sandbox reaches no I/O, so there is nothing to mock.
export const typescriptLoadHarnessAdapterProxy = (): Record<PropertyKey, never> => ({});
