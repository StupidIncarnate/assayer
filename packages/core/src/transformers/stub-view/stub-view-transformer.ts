/**
 * PURPOSE: Combines the DERIVED stub index with the COMMITTED overlay into a stub view, at
 *   display/consume time and NEVER persisted — the overlay is in no hash, so this combine never touches
 *   the derived cache. A human correction WINS: for an object stub, each property the matching overlay
 *   names has its demanded values REPLACED (a property the overlay does not name keeps its derived
 *   demand); for an env stub, the values are REPLACED and `guessed` cleared, because a human-supplied
 *   value is authoritative, not a guess. An overlay whose key matches no derived stub is ignored here —
 *   a stale overlay is a build error raised separately by the reconcile broker, not this pure combine.
 *   Values are deduped and sorted, and stubs are sorted by key, for byte-identical output.
 *
 * USAGE:
 * stubViewTransformer({ index, overlays });
 * // Returns a StubView: { objectStubs, envStubs } with corrected values spliced over the derived demand
 */
import { envStubContract, objectStubContract, stubViewContract } from '@assayer/shared/contracts';
import type { StubIndex, StubOverlay, StubView } from '@assayer/shared/contracts';

export const stubViewTransformer = ({
  index,
  overlays,
}: {
  index: StubIndex;
  overlays: readonly StubOverlay[];
}): StubView => {
  const objectOverlayByKey = new Map(
    overlays.flatMap((overlay) => (overlay.kind === 'object' ? [[String(overlay.key), overlay] as const] : [])),
  );
  const envOverlayByKey = new Map(
    overlays.flatMap((overlay) => (overlay.kind === 'env' ? [[String(overlay.key), overlay] as const] : [])),
  );

  const objectStubs = index.objectStubs
    .map((stub) => {
      const overlay = objectOverlayByKey.get(String(stub.key));

      if (overlay === undefined) {
        return stub;
      }

      const correctionByName = new Map(overlay.properties.map((property) => [String(property.name), property.values]));
      const properties = stub.properties.map((property) => {
        const corrected = correctionByName.get(String(property.name));

        if (corrected === undefined) {
          return property;
        }

        const values = [...new Map(corrected.map((value) => [JSON.stringify(value), value])).values()].sort((a, b) =>
          JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
        );

        return { name: property.name, demand: { kind: 'demanded', values } };
      });

      return objectStubContract.parse({ ...stub, properties });
    })
    .sort((a, b) => (String(a.key) < String(b.key) ? -1 : 1));

  const envStubs = index.envStubs
    .map((stub) => {
      const overlay = envOverlayByKey.get(String(stub.key));

      if (overlay === undefined) {
        return stub;
      }

      const values = [...new Map(overlay.values.map((value) => [JSON.stringify(value), value])).values()].sort((a, b) =>
        JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
      );

      return envStubContract.parse({ ...stub, values, guessed: false });
    })
    .sort((a, b) => (String(a.key) < String(b.key) ? -1 : 1));

  return stubViewContract.parse({ objectStubs, envStubs });
};
