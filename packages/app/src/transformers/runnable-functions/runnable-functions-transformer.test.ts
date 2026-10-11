import { runnableFunctionsTransformer } from './runnable-functions-transformer';
import { EntrySignatureStub } from '@assayer/shared/contracts/entry-signature/entry-signature.stub';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';
import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';

// The real module-scope shape for a branch on an opaque operand: nothing can call it, and it derives
// no case.
const MODULE_ENTRY = EntrySignatureStub({
  name: '*module*',
  scopePath: ['*module*'],
  params: [],
  access: { kind: 'unreachable' },
});

describe('runnableFunctionsTransformer', () => {
  describe('narrowing to what a run executes', () => {
    it('VALID: {an entry with cases} => keeps it', () => {
      const entry = FunctionAnalysisStub();

      const result = runnableFunctionsTransformer({ functions: [entry] });

      expect(result).toStrictEqual([entry]);
    });

    // The undriven fallback shape: an un-steerable branch still derives the case for the arm default
    // execution takes, and that case runs.
    it('VALID: {an undriven entry with a fallback case} => keeps it', () => {
      const entry = FunctionAnalysisStub({
        entry: EntrySignatureStub({ name: 'booleanCondEqNumberValueExternal', params: [] }),
        cases: [{ reachesPath: ['booleanCondEqNumberValueExternal/return@else'], arrange: [] }],
      });

      const result = runnableFunctionsTransformer({ functions: [entry] });

      expect(result).toStrictEqual([entry]);
    });

    it('VALID: {an unreachable entry with cases} => drops it', () => {
      const result = runnableFunctionsTransformer({
        functions: [FunctionAnalysisStub({ entry: MODULE_ENTRY })],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {a reachable entry with no cases} => drops it', () => {
      const result = runnableFunctionsTransformer({ functions: [FunctionAnalysisStub({ cases: [] })] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {one runnable and one unreachable entry} => keeps only the runnable one', () => {
      const runnable = FunctionAnalysisStub({ entry: EntrySignatureStub({ name: 'classify' }) });

      const result = runnableFunctionsTransformer({
        functions: [runnable, FunctionAnalysisStub({ entry: MODULE_ENTRY })],
      });

      expect(result).toStrictEqual([runnable]);
    });

    it('VALID: {the file analysis stub} => returns every entry unchanged', () => {
      const { functions } = FileAnalysisStub();

      const result = runnableFunctionsTransformer({ functions });

      expect(result).toStrictEqual(functions);
    });

    it('EMPTY: {no entries} => returns no entries', () => {
      expect(runnableFunctionsTransformer({ functions: [] })).toStrictEqual([]);
    });
  });
});
