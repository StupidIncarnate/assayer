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
