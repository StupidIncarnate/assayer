export {};

declare global {
  interface Window {
    // Optional: injected by the Electron preload's contextBridge at runtime. It is ABSENT
    // whenever the preload fails to run (sandbox, bad path) or the renderer loads outside
    // Electron — so consumers MUST guard for undefined rather than assume it exists.
    assayerBridge?: {
      getStatus: () => Promise<unknown>;
    };
  }
}
