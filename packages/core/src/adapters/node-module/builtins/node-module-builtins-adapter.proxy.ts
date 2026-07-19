// Empty proxy: the adapter reads node's own builtin-module list, which is deterministic for a given
// node version — the real list is what every consumer wants, so no mocking is needed.
export const nodeModuleBuiltinsAdapterProxy = (): Record<PropertyKey, never> => ({});
