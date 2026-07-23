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
      // The merged stub view (derived stub index + committed overlay) the /stubs view renders.
      getStubs?: () => Promise<unknown>;
      // Separate all the way across the bridge: reading what a file's last run said must never be
      // able to start one.
      runFile?: (params: { relPath: string }) => Promise<unknown>;
      getSavedRun?: (params: { relPath: string }) => Promise<unknown>;
      // Subscribes to the running CLI's console output, returning its own unsubscribe — a renderer
      // cannot hand the same function reference back across the bridge to remove a listener itself.
      onRunOutput?: (params: { onChunk: (params: { chunk: string }) => void }) => () => void;
    };
  }
}
