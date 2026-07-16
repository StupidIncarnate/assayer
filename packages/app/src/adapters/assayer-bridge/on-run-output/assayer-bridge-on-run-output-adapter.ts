/**
 * PURPOSE: Subscribes to the running CLI's console output over the preload contextBridge
 *   (window.assayerBridge.onRunOutput), handing back the unsubscribe the bridge returned.
 *
 *   A MISSING bridge returns a no-op unsubscribe instead of throwing, unlike the adapters that fetch
 *   or run. Those are answering a question the caller asked and must say when they cannot; this one
 *   only narrates a run, and a subscriber that threw on mount would take the whole window down
 *   outside Electron — where there is no run to narrate anyway, and where `runFile` already reports
 *   the missing bridge with the actionable message.
 *
 * USAGE:
 * const unsubscribe = assayerBridgeOnRunOutputAdapter({ onChunk: ({ chunk }) => append(chunk) });
 * // Returns the unsubscribe; call it to stop listening
 */
export const assayerBridgeOnRunOutputAdapter = ({
  onChunk,
}: {
  onChunk: (params: { chunk: string }) => void;
}): (() => void) => {
  const bridge = window.assayerBridge;

  if (bridge?.onRunOutput === undefined) {
    return (): void => undefined;
  }

  return bridge.onRunOutput({ onChunk });
};
