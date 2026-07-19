// Empty proxy: the adapter wraps the real TypeScript config reader against a real tsconfig on disk,
// exactly the resolution logic the tests must validate — mocking it would verify a stub, not the API.
export const typescriptReadConfigAdapterProxy = (): Record<PropertyKey, never> => ({});
