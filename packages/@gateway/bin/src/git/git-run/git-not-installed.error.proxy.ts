// `GitNotInstalledError` is a plain error class with nothing to stage. A caller checks it with
// `instanceof`. This file exists because `enforce-proxy-child-creation` expects a proxy for every
// name the gateway barrel re-exports. To stage the error itself, call `setupNotFound` on the proxy
// of the git function the caller uses, such as `lsTreeProxy().setupNotFound`.
export const GitNotInstalledErrorProxy = (): Record<PropertyKey, never> => ({});
