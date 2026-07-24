import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { runCrossFileProbesBroker } from './run-cross-file-probes-broker';
import { runCrossFileProbesBrokerProxy } from './run-cross-file-probes-broker.proxy';

const PARENT_SOURCE =
  "import { bandReading } from './band-reading';\n" +
  'export function bandReadings(items: number[]): string[] {\n  return items.map(bandReading);\n}\n';

const CHILD_SOURCE =
  'export function bandReading(n: number): string {\n  if (n >= 80) {\n    return "high";\n  }\n  if (n < 20) {\n    return "low";\n  }\n  return "mid";\n}\n';

describe('runCrossFileProbesBroker', () => {
  describe('a target that maps an imported callee', () => {
    it('VALID: {items.map(bandReading)} => writes the sibling probe plan keyed on its content hash, returns its relPath', async () => {
      const proxy = runCrossFileProbesBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/band-reading.ts', source: CHILD_SOURCE });
      const walked = tsMorphWalkFileAdapter({ source: PARENT_SOURCE, relPath: 'src/cross-file-map.ts' });

      const result = await runCrossFileProbesBroker({ walked, root: '/repo', relPath: 'src/cross-file-map.ts', probeDir: '/repo/.assayer/cache/probes' });

      const hash = cryptoSha256Adapter({ content: CHILD_SOURCE });

      expect({
        instrumented: result.map((relPath) => String(relPath)),
        written: String(proxy.lastWrittenPath()),
      }).toStrictEqual({
        instrumented: ['src/band-reading.ts'],
        written: `/repo/.assayer/cache/probes/${String(hash)}.json`,
      });
    });
  });

  describe('a target with no cross-file map reach', () => {
    it('EMPTY: {items.map((n) => n)} => writes nothing and returns no instrumented siblings', async () => {
      const proxy = runCrossFileProbesBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: 'export function scale(items: number[]): number[] {\n  return items.map((n) => n * 2);\n}\n', relPath: 'src/scale.ts' });

      const result = await runCrossFileProbesBroker({ walked, root: '/repo', relPath: 'src/scale.ts', probeDir: '/repo/.assayer/cache/probes' });

      expect({ instrumented: result.map((relPath) => String(relPath)), written: proxy.lastWrittenPath() }).toStrictEqual({
        instrumented: [],
        written: undefined,
      });
    });
  });
});
