// The bundled compiler runs real. A wrapper that reads the disk through it (`resolveModuleFile`,
// `readNearestTsconfig`) stages its own calls in its own proxy.
export const bundledTypescriptProxy = (): Record<PropertyKey, never> => ({});
