import { drivenFunctionsTransformer } from './driven-functions-transformer';
import {
  EntrySignatureStub,
  FileAnalysisStub,
  FunctionAnalysisStub,
  UndrivenEntryStub,
} from '@assayer/shared/contracts';

// The real module-scope shape: nothing can call it, and it takes no params — which is why its derived
// cases all arrange nothing.
const MODULE_ENTRY = EntrySignatureStub({
  name: '*module*',
  scopePath: ['*module*'],
  params: [],
  access: { kind: 'unreachable' },
});

describe('drivenFunctionsTransformer', () => {
  describe('narrowing to what a run drives', () => {
    // The pure-statement shape: the only entry is a module scope the run reports as undriven, so
    // there is nothing left to advertise cases for.
    it('VALID: {the only entry is undriven} => returns no entries', () => {
      const result = drivenFunctionsTransformer({
        functions: [FunctionAnalysisStub({ entry: MODULE_ENTRY })],
        undriven: [UndrivenEntryStub({ name: '*module*' })],
      });

      expect(result).toStrictEqual([]);
    });

    // The nested-function shape: a live entry beside an undriven private. The private is not an entry
    // at all, so the live one must survive untouched.
    it('VALID: {an undriven name that is not an entry} => every entry survives', () => {
      const outer = FunctionAnalysisStub({ entry: EntrySignatureStub({ name: 'outer' }) });

      const result = drivenFunctionsTransformer({ functions: [outer], undriven: [UndrivenEntryStub({ name: 'inner' })] });

      expect(result).toStrictEqual([outer]);
    });

    it('VALID: {one driven and one undriven entry} => keeps only the driven one', () => {
      const driven = FunctionAnalysisStub({ entry: EntrySignatureStub({ name: 'classify' }) });

      const result = drivenFunctionsTransformer({
        functions: [driven, FunctionAnalysisStub({ entry: MODULE_ENTRY })],
        undriven: [UndrivenEntryStub({ name: '*module*' })],
      });

      expect(result).toStrictEqual([driven]);
    });

    it('EMPTY: {nothing undriven} => returns every entry unchanged', () => {
      const { functions } = FileAnalysisStub();

      const result = drivenFunctionsTransformer({ functions, undriven: [] });

      expect(result).toStrictEqual(functions);
    });

    it('EMPTY: {no entries} => returns no entries', () => {
      expect(drivenFunctionsTransformer({ functions: [], undriven: [UndrivenEntryStub()] })).toStrictEqual([]);
    });
  });
});
