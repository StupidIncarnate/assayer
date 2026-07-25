import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';
import { composeCrossFileMapBroker } from './compose-cross-file-map-broker';
import { composeCrossFileMapBrokerProxy } from './compose-cross-file-map-broker.proxy';

const PARENT_SOURCE =
  "import { bandReading } from './band-reading';\n" +
  'export function bandReadings(items: number[]): string[] {\n  return items.map(bandReading);\n}\n';

const CHILD_SOURCE =
  'export function bandReading(n: number): string {\n  if (n >= 80) {\n    return "high";\n  }\n  if (n < 20) {\n    return "low";\n  }\n  return "mid";\n}\n';

const PLAIN_SOURCE = 'export function grade(n: number): string {\n  if (n > 5) {\n    return "big";\n  }\n  return "small";\n}\n';

const HIGH = 'if:BinaryExpression,id:n,GreaterThanEqualsToken,num:80';
const LOW = 'if:BinaryExpression,id:n,LessThanToken,num:20';
const HIGH_EXIT = `*module*/bandReading/return@${HIGH}#then`;
const LOW_EXIT = `*module*/bandReading/return@${HIGH}#else/${LOW}#then`;
const MID_EXIT = `*module*/bandReading/return@${HIGH}#else/${LOW}#else`;
const READINGS_EXIT = '*module*/bandReadings/return@top';

// The invoice VERBATIM — product surface. The gap is filed under the HOST (the only entry the fold
// leaves) while the refusal and the harness snippet both name the SIBLING that declares the parameter.
const SIBLING_GAP_REASON =
  '`bandReadings` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
  'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
  'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
  'its name: `sink: (m: string) => void` on `bandReading`. Substituting a stand-in would be worse than ' +
  'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
  'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
  "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
  "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
  'assayerHarness({ inputs: { bandReading: { sink: <a (m: string) => void> } } });`. Assayer then ' +
  'builds them from that declaration instead of refusing them; anything else still standing between ' +
  '`bandReadings` and a case is reported on its own line.';

describe('composeCrossFileMapBroker', () => {
  describe('a surface mapping an imported branching function over its array param', () => {
    it('VALID: {items.map(bandReading), bandReading branches on n} => the callee`s branches funnel into the host`s cases', () => {
      const proxy = composeCrossFileMapBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/band-reading.ts', source: CHILD_SOURCE });
      const walked = tsMorphWalkFileAdapter({ source: PARENT_SOURCE, relPath: 'src/cross-file-map.ts' });

      const result = composeCrossFileMapBroker({ analysis: analyzeFileBroker({ walked, relPath: 'src/cross-file-map.ts' }), walked, root: '/repo', relPath: 'src/cross-file-map.ts' });

      expect(result.functions.map((fn) => ({ name: fn.entry.name, cases: fn.cases }))).toStrictEqual([
        {
          name: 'bandReadings',
          cases: [
            { reachesPath: [READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [] }], salient: true },
            { reachesPath: [HIGH_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [80] }], salient: true },
            { reachesPath: [LOW_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [19] }], salient: true },
            { reachesPath: [MID_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [79] }], salient: true },
            { reachesPath: [HIGH_EXIT, LOW_EXIT, READINGS_EXIT], arrange: [{ kind: 'array', param: 'items', value: [80, 19] }], salient: true },
          ],
        },
      ]);
    });

    it('VALID: {the folded host} => its own exit unioned with the sibling callee`s three band exits', () => {
      const proxy = composeCrossFileMapBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/band-reading.ts', source: CHILD_SOURCE });
      const walked = tsMorphWalkFileAdapter({ source: PARENT_SOURCE, relPath: 'src/cross-file-map.ts' });

      const result = composeCrossFileMapBroker({ analysis: analyzeFileBroker({ walked, relPath: 'src/cross-file-map.ts' }), walked, root: '/repo', relPath: 'src/cross-file-map.ts' });

      expect(result.functions[0]?.exits.map((exit) => String(exit.coverageId))).toStrictEqual([
        READINGS_EXIT,
        HIGH_EXIT,
        LOW_EXIT,
        MID_EXIT,
      ]);
    });
  });

  describe('a sibling callee declaring a parameter the fill seam refuses', () => {
    // The fold leaves the host as the only entry, so a parameter the SIBLING declares and no value can
    // be built for is the host's invoice to carry. Dropped, the host would come back with its
    // empty-array case alone and nothing said about the element shapes it never derived.
    const SINK_CHILD_SOURCE =
      'export function bandReading(n: number, sink: (m: string) => void): string {\n' +
      '  if (n >= 80) {\n    return "high";\n  }\n  return "mid";\n}\n';

    it('VALID: {the sibling also takes a callback} => a GAP on the host, naming the sibling that declares it', () => {
      const proxy = composeCrossFileMapBrokerProxy();
      proxy.setupSibling({ fileName: '/repo/src/band-reading.ts', source: SINK_CHILD_SOURCE });
      const walked = tsMorphWalkFileAdapter({ source: PARENT_SOURCE, relPath: 'src/cross-file-map.ts' });

      const result = composeCrossFileMapBroker({
        analysis: analyzeFileBroker({ walked, relPath: 'src/cross-file-map.ts' }),
        walked,
        root: '/repo',
        relPath: 'src/cross-file-map.ts',
      });

      expect(result.gaps).toStrictEqual([{ name: 'bandReadings', reason: SIBLING_GAP_REASON }]);
    });
  });

  describe('a file with no cross-file map', () => {
    it('EMPTY: {a plain if function} => the analysis passes through unchanged, no sibling read', () => {
      composeCrossFileMapBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: PLAIN_SOURCE, relPath: 'src/grade.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/grade.ts' });

      const result = composeCrossFileMapBroker({ analysis, walked, root: '/repo', relPath: 'src/grade.ts' });

      expect(result).toBe(analysis);
    });
  });
});
