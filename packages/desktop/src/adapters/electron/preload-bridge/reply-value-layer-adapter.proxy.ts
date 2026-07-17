/**
 * WHY EMPTY: the layer reads a plain object and either hands back a field or throws. It touches no npm
 * package and no global, so there is no I/O boundary to stand up — the reply it reads is just an
 * argument the test passes in.
 */
export const replyValueLayerAdapterProxy = (): Record<PropertyKey, never> => ({});
