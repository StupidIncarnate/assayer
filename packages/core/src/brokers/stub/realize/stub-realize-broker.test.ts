import { StubOverlayStub } from '@assayer/shared/contracts';

import { tsMorphWalkFileAdapter } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';

import { stubRealizeBroker } from './stub-realize-broker';
import { stubRealizeBrokerProxy } from './stub-realize-broker.proxy';

const SAME_FILE_SOURCE =
  'interface Config {\n  mode: string;\n}\n\nexport function decide(config: Config): string {\n  if (config.mode === \'a\') {\n    return \'x\';\n  }\n\n  return \'y\';\n}\n';

const CROSS_FILE_SOURCE =
  "import { Config } from './types';\n\nexport function decideA(config: Config): string {\n  if (config.mode === 'a') {\n    return 'x';\n  }\n\n  return 'y';\n}\n";

// `withDefaults` uses `Config` as a param so the hermetic walk ENUMERATES its shape into declaredTypes —
// a bare interface with no local use does not enumerate, which is what stub-realize reads cross-file.
const TYPES_SOURCE =
  'export interface Config {\n  mode: string;\n  region: string;\n}\n\nexport function withDefaults(config: Config): Config {\n  return config;\n}\n';

const PLAIN_SOURCE = "export function grade(n: number): string {\n  if (n > 5) {\n    return 'p';\n  }\n\n  return 'f';\n}\n";

const THEN = '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#then';
const ELSE = '*module*/decide/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#else';

describe('stubRealizeBroker', () => {
  describe('a same-file object-member branch, no correction', () => {
    it("VALID: {if (config.mode === 'a')} => both arms driven from the derived demand, undriven cleared", () => {
      stubRealizeBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: SAME_FILE_SOURCE, relPath: 'src/decide.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/decide.ts' });

      const result = stubRealizeBroker({ analysis, walked, root: '/repo', relPath: 'src/decide.ts', overlays: [] });

      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        undriven: result.undriven,
      }).toStrictEqual({
        cases: [
          { reachesExit: THEN, arrange: [{ kind: 'object', param: 'config', value: { mode: 'a' } }], salient: true },
          { reachesExit: ELSE, arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123' } }], salient: true },
        ],
        undriven: [],
      });
    });
  });

  describe('a same-file object-member branch, WITH a committed correction that admits the guard', () => {
    // The stub-repository payoff, P4-safe: the corrected values are AUTHORITATIVE, so each arm arranges
    // one of them — a HUMAN-supplied INPUT, never a code-derived output. The correction includes 'a', so
    // the then arm arranges the corrected 'a' the guard admits and the else arm the first corrected non-'a'.
    it("VALID: {mode corrected to ['a','dev','prod']} => then arranges the corrected 'a', else the corrected 'dev'", () => {
      stubRealizeBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: SAME_FILE_SOURCE, relPath: 'src/decide.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/decide.ts' });

      const result = stubRealizeBroker({
        analysis,
        walked,
        root: '/repo',
        relPath: 'src/decide.ts',
        overlays: [
          StubOverlayStub({
            key: 'src/decide.ts#Config',
            overlayPath: 'assayer/stubs/objects/src/decide.ts/Config.json',
            properties: [{ name: 'mode', values: ['a', 'dev', 'prod'] }],
          }),
        ],
      });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesExit: THEN, arrange: [{ kind: 'object', param: 'config', value: { mode: 'a' } }], salient: true },
        { reachesExit: ELSE, arrange: [{ kind: 'object', param: 'config', value: { mode: 'dev' } }], salient: true },
      ]);
    });
  });

  describe('a same-file object-member branch, WITH a committed correction that CONTRADICTS the guard', () => {
    // Authoritative means no fallback: the human corrected `mode` to a set WITHOUT 'a', so the then arm's
    // `mode === 'a'` guard is dead under that truth. Object-arrange marks the bucket unreachable and
    // stub-realize drops it — NO bogus case for the then exit — while the else arm still arranges the
    // corrected 'dev'. The contradiction itself is a P1 raised by stub-contradictions before running.
    it("VALID: {mode corrected to ['dev','prod'] (no 'a')} => the then case is dropped, only the else arm arranges 'dev'", () => {
      stubRealizeBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: SAME_FILE_SOURCE, relPath: 'src/decide.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/decide.ts' });

      const result = stubRealizeBroker({
        analysis,
        walked,
        root: '/repo',
        relPath: 'src/decide.ts',
        overlays: [
          StubOverlayStub({
            key: 'src/decide.ts#Config',
            overlayPath: 'assayer/stubs/objects/src/decide.ts/Config.json',
            properties: [{ name: 'mode', values: ['dev', 'prod'] }],
          }),
        ],
      });

      expect(result.functions.flatMap((fn) => fn.cases)).toStrictEqual([
        { reachesExit: ELSE, arrange: [{ kind: 'object', param: 'config', value: { mode: 'dev' } }], salient: true },
      ]);
    });
  });

  describe('a cross-file object type resolved through the import', () => {
    it("VALID: {config: Config from './types', if (config.mode === 'a')} => both arms driven, region filled", () => {
      const proxy = stubRealizeBrokerProxy();
      proxy.setupTypeDefinition({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE });
      const walked = tsMorphWalkFileAdapter({ source: CROSS_FILE_SOURCE, relPath: 'src/caller.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/caller.ts' });

      const result = stubRealizeBroker({ analysis, walked, root: '/repo', relPath: 'src/caller.ts', overlays: [] });

      expect({
        cases: result.functions.flatMap((fn) => fn.cases),
        undriven: result.undriven,
      }).toStrictEqual({
        cases: [
          {
            reachesExit: '*module*/decideA/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#then',
            arrange: [{ kind: 'object', param: 'config', value: { mode: 'a', region: 'abc123' } }],
            salient: true,
          },
          {
            reachesExit: '*module*/decideA/return@if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#else',
            arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123', region: 'abc123' } }],
            salient: true,
          },
        ],
        undriven: [],
      });
    });
  });

  describe('a file with no object-member branch', () => {
    it('EMPTY: {if (n > 5)} => the analysis passes through unchanged, no disk read', () => {
      stubRealizeBrokerProxy();
      const walked = tsMorphWalkFileAdapter({ source: PLAIN_SOURCE, relPath: 'src/grade.ts' });
      const analysis = analyzeFileBroker({ walked, relPath: 'src/grade.ts' });

      const result = stubRealizeBroker({ analysis, walked, root: '/repo', relPath: 'src/grade.ts', overlays: [] });

      expect(result).toBe(analysis);
    });
  });
});
