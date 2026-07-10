export {};

declare global {
  interface Window {
    // Optional: injected by the Electron preload's contextBridge at runtime. It is ABSENT
    // whenever the preload fails to run (sandbox, bad path) or the renderer loads outside
    // Electron — so consumers MUST guard for undefined rather than assume it exists. Each
    // method is independently optional so a test proxy can stand up just the channel it
    // exercises (and adapters guard the specific method they call, not just the bridge object).
    assayerBridge?: {
      getStatus?: () => Promise<unknown>;
      getCompiledTree?: () => Promise<unknown>;
      getCompiledFile?: (params: { relPath: string }) => Promise<unknown>;
    };
  }
}
