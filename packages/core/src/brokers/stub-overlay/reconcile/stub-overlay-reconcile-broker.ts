/**
 * PURPOSE: Reconciles the COMMITTED stub overlay against the DERIVED stub index and reports every STALE
 *   correction as a P1 build error — the first concrete instance of the committed-override-that-errors-
 *   on-stale-refs pattern. A correction is stale when the thing it addresses no longer exists: an object
 *   overlay whose type-key is absent from the index, an object overlay naming a property absent from that
 *   type's FULL property list, or an env overlay whose key is absent from the env stubs. Each error names
 *   the committed overlay FILE, the stub identity, and the fix, so an LLM can rectify it without a human.
 *   Errors ride the SAME `{ relPath, line, column, message }` channel as an import-resolution failure —
 *   folded into `compileRunBroker`'s `errors[]`, exit 1, the same class as a broken import.
 *
 * USAGE:
 * stubOverlayReconcileBroker({ index, overlays });
 * // Returns [] when every correction still resolves, or
 * // [{ relPath: 'assayer/stubs/objects/src/config/config.ts/Config.json', line: 1, column: 1,
 * //    message: "type 'src/config/config.ts#Config' no longer exists (renamed, moved, or deleted) — rectify this stub" }]
 */
import { columnNumberContract, lineNumberContract, relPathContract } from '@assayer/shared/contracts';
import type { ColumnNumber, LineNumber, RelPath, StubIndex, StubOverlay } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

const OVERLAY_LINE = 1;
const OVERLAY_COLUMN = 1;

export const stubOverlayReconcileBroker = ({
  index,
  overlays,
}: {
  index: StubIndex;
  overlays: readonly StubOverlay[];
}): readonly { relPath: RelPath; line: LineNumber; column: ColumnNumber; message: ErrorMessage }[] => {
  const objectByKey = new Map(index.objectStubs.map((stub) => [String(stub.key), stub]));
  const envByKey = new Map(index.envStubs.map((stub) => [String(stub.key), stub]));

  const raw = overlays.flatMap((overlay) => {
    if (overlay.kind === 'object') {
      const stub = objectByKey.get(String(overlay.key));

      if (stub === undefined) {
        return [
          {
            overlayPath: overlay.overlayPath,
            message: `type '${String(overlay.key)}' no longer exists (renamed, moved, or deleted) — rectify this stub`,
          },
        ];
      }

      const known = new Set(stub.properties.map((property) => String(property.name)));

      return overlay.properties
        .filter((property) => !known.has(String(property.name)))
        .map((property) => ({
          overlayPath: overlay.overlayPath,
          message: `property '${String(property.name)}' is not on type '${String(overlay.key)}' — rectify this stub`,
        }));
    }

    const envStub = envByKey.get(String(overlay.key));

    return envStub === undefined
      ? [
          {
            overlayPath: overlay.overlayPath,
            message: `env property '${String(overlay.property)}' is no longer read anywhere (renamed or deleted) — rectify this stub`,
          },
        ]
      : [];
  });

  return raw
    .map((entry) => ({
      relPath: relPathContract.parse(String(entry.overlayPath)),
      line: lineNumberContract.parse(OVERLAY_LINE),
      column: columnNumberContract.parse(OVERLAY_COLUMN),
      message: errorMessageContract.parse(entry.message),
    }))
    .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
};
