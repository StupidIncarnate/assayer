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
            exitIds: ['formatGreeting/return@if-then'],
            cases: [{ reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }] }],
          },
        ],
      });
    });
  });

  describe('entries nothing can call', () => {
    // The module scope is analyzable but not RUNNABLE: its branches fire at require time and there is
    // no function to invoke. Dropping it here is policy, which is why it lives in the projection
    // rather than in the walk.
    it('EDGE: {a *module* scope entry} => dropped, since a module scope cannot be invoked', () => {
      const analysis = FileAnalysisStub({
        functions: [
          FunctionAnalysisStub({
            entry: {
              name: '*module*',
              scopePath: ['*module*'],
              params: [],
              returnType: { kind: 'unknown', text: 'void' },
              line: 1,
            },
          }),
        ],
      });

      const result = caseSetProjectionTransformer({
        analysis,
        relPath: 'src/pure-statement.ts',
        modulePath: '/abs/src/pure-statement.ts',
      });

      expect(result.entries).toStrictEqual([]);
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
