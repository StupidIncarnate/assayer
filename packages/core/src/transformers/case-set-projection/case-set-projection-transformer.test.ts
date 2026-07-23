import { FileAnalysisStub, FunctionAnalysisStub } from '@assayer/shared/contracts';

import { caseSetProjectionTransformer } from './case-set-projection-transformer';

describe('caseSetProjectionTransformer', () => {
  describe('entries something can call', () => {
    it('VALID: {an exported function with cases} => one runnable entry carrying its own exit ids', () => {
      const result = caseSetProjectionTransformer({
        analysis: FileAnalysisStub(),
        relPath: 'src/format-greeting.ts',
        modulePath: '/abs/src/format-greeting.ts',
      });

      expect(result).toStrictEqual({
        relPath: 'src/format-greeting.ts',
        modulePath: '/abs/src/format-greeting.ts',
        entries: [
          {
            name: 'formatGreeting',
            access: { kind: 'named' },
            exitIds: ['formatGreeting/return@if-then'],
            cases: [{ reachesExit: 'formatGreeting/return@if-then', arrange: [{ kind: 'param', param: 'name', value: '' }], salient: true }],
          },
        ],
        gaps: [],
        darkSpots: [],
        undriven: [],
        lints: [],
      });
    });

    // A method is reachable — through an instance — so it is RUNNABLE, not a gap. Driving it as
    // though it were a named export is what reported correct code as failing.
    it('VALID: {a method of a zero-arg class} => runnable, carrying the access that reaches it', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: 'classify',
              scopePath: ['Classifier', 'classify'],
              params: [{ name: 'value', type: { kind: 'number' } }],
              returnType: { kind: 'string' },
              line: 2,
              access: { kind: 'method', className: 'Classifier', constructable: true },
            },
          }),
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/in-class.ts',
        modulePath: '/abs/src/in-class.ts',
      });

      expect(result.entries).toStrictEqual([
        {
          name: 'classify',
          access: { kind: 'method', className: 'Classifier', constructable: true },
          exitIds: ['formatGreeting/return@if-then'],
          cases: [{ reachesExit: 'formatGreeting/return@if-then', arrange: [{ kind: 'param', param: 'name', value: '' }], salient: true }],
        },
      ]);
    });

    // A module that CONSUMES an external (calls an import or an ambient global) is projected with no
    // branches — importing it runs the call and reaches its single exit. It is runnable: its one
    // structural happy-path case arranges nothing and asserts only that it reaches the module's exit.
    it('VALID: {a branchless consumption module scope} => runnable, deriving its one happy-path case', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'unknown', text: 'void' },
              line: 1,
              access: { kind: 'module' },
            },
            branches: [],
            exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
            cases: [{ reachesExit: '*module*/exit@top', arrange: [], salient: true }],
          }),
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/uses-greeting.ts',
        modulePath: '/abs/src/uses-greeting.ts',
      });

      expect(result.entries).toStrictEqual([
        {
          name: '*module*',
          access: { kind: 'module' },
          exitIds: ['*module*/exit@top'],
          cases: [{ reachesExit: '*module*/exit@top', arrange: [], salient: true }],
        },
      ]);
    });

    it('VALID: {a default export} => runnable, since `default` reaches it', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: 'formatGreeting',
              scopePath: ['formatGreeting'],
              params: [{ name: 'name', type: { kind: 'string' } }],
              returnType: { kind: 'string' },
              line: 1,
              access: { kind: 'default' },
            },
          }),
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/f.ts',
        modulePath: '/abs/src/f.ts',
      });

      expect(result.entries.map((entry) => entry.access)).toStrictEqual([{ kind: 'default' }]);
    });
  });

  describe('entries it cannot construct', () => {
    // Named, not dropped and not driven: something real is untested, and only a human can say how to
    // build the class. Driving it anyway would fail a case against correct code.
    it('VALID: {a method whose class needs ctor args} => a NAMED gap rather than a runnable entry', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: 'find',
              scopePath: ['Repo', 'find'],
              params: [{ name: 'id', type: { kind: 'string' } }],
              returnType: { kind: 'string' },
              line: 4,
              access: { kind: 'method', className: 'Repo', constructable: false },
            },
          }),
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/repo.ts',
        modulePath: '/abs/src/repo.ts',
      });

      expect({ entries: result.entries, gaps: result.gaps }).toStrictEqual({
        entries: [],
        gaps: [
          {
            name: 'find',
            reason: 'its class needs constructor arguments, so no instance can be built to drive it — needs a harness',
          },
        ],
      });
    });
  });

  describe('constructors', () => {
    // Driving it as a method resolves the CLASS, and applying that without `new` throws — a failing
    // case against correct code, for every class with an explicit constructor.
    it('VALID: {a constructor} => a NAMED gap rather than something driven', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: 'constructor',
              scopePath: ['Gauge', 'constructor'],
              params: [],
              returnType: { kind: 'unknown', text: 'void' },
              line: 2,
              access: { kind: 'constructor', className: 'Gauge' },
            },
          }),
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/gauge.ts',
        modulePath: '/abs/src/gauge.ts',
      });

      expect({ entries: result.entries, gaps: result.gaps }).toStrictEqual({
        entries: [],
        gaps: [
          {
            name: 'constructor',
            reason: 'a constructor is reached through `new`, which the runner does not drive — needs a harness',
          },
        ],
      });
    });
  });

  describe('entries nothing can call', () => {
    // The module scope is analyzable but not RUNNABLE: its branches fire at require time and there is
    // no function to invoke. It is not a gap — no harness reaches it — so it is dropped from the
    // entries and admitted on the `undriven` channel the analysis already filled in.
    it('EDGE: {a *module* scope entry} => not driven, and not a gap either', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'unknown', text: 'void' },
              line: 1,
              access: { kind: 'unreachable' },
            },
          }),
        ],
        undriven: [
          {
            name: '*module*',
            reason: 'it runs at import time, so no case drove its branches',
            startLine: 1,
            endLine: 8,
          },
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/pure-statement.ts',
        modulePath: '/abs/src/pure-statement.ts',
      });

      expect({ entries: result.entries, gaps: result.gaps, undriven: result.undriven }).toStrictEqual({
        entries: [],
        gaps: [],
        undriven: [
          {
            name: '*module*',
            reason: 'it runs at import time, so no case drove its branches',
            startLine: 1,
            endLine: 8,
          },
        ],
      });
    });

    // A module that BRANCHES on values welded into its own source (no env operand) is NOT runnable:
    // its cases arrange the same nothing and claim different exits, so at most one could hold. Only a
    // branchless consumption module or a module reading an env operand is driven — this stays dropped,
    // and the walk's undriven channel admits it separately.
    it('EDGE: {a module scope branching on welded-in values, no env operand} => dropped, not runnable', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'unknown', text: 'void' },
              line: 1,
              access: { kind: 'module' },
            },
          }),
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/welded.ts',
        modulePath: '/abs/src/welded.ts',
      });

      expect({ entries: result.entries, gaps: result.gaps }).toStrictEqual({ entries: [], gaps: [] });
    });

    it('EMPTY: {an entry with no derived cases} => dropped, since there is nothing to drive', () => {
      const analysis = FileAnalysisStub({ functions: [FunctionAnalysisStub({ cases: [] })] });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/f.ts',
        modulePath: '/abs/src/f.ts',
      });

      expect(result.entries).toStrictEqual([]);
    });

    it('EMPTY: {no functions at all} => an empty set rather than nothing', () => {
      const result = caseSetProjectionTransformer({
        analysis: FileAnalysisStub({ functions: [] }),
        relPath: 'src/f.ts',
        modulePath: '/abs/src/f.ts',
      });

      expect(result.entries).toStrictEqual([]);
    });
  });
});
