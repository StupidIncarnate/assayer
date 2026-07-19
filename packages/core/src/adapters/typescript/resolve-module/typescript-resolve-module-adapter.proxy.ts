// Empty proxy: the adapter wraps the real TypeScript module resolver against real files on disk —
// resolution IS the logic under test, so it runs real; consumers that must control resolution mock
// this adapter directly (registerMock) in their own proxy.
export const typescriptResolveModuleAdapterProxy = (): Record<PropertyKey, never> => ({});
