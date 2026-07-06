export {};

declare global {
  interface Window {
    assayerBridge: {
      getStatus: () => Promise<unknown>;
    };
  }
}
