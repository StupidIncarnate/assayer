import { ParamDescriptorStub, SymbolNameStub, TypeDescriptorStub } from '@assayer/shared/contracts';

import { appliedParamsTransformer } from './applied-params-transformer';

const SIZE = ParamDescriptorStub({ name: 'size', type: { kind: 'number' } });
const REPORT_TYPE = TypeDescriptorStub({ kind: 'callable', text: '(m: string) => void' });

describe('appliedParamsTransformer', () => {
  describe('parameters a call must supply', () => {
    it('VALID: {two required scalars} => both, unchanged', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'label', type: { kind: 'string' } })];

      expect(appliedParamsTransformer({ params })).toStrictEqual([
        { name: 'size', type: { kind: 'number' } },
        { name: 'label', type: { kind: 'string' } },
      ]);
    });

    it('VALID: {a required callback the seam refuses} => kept, because the entry cannot be called without it', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'report', type: REPORT_TYPE })];

      expect(appliedParamsTransformer({ params })).toStrictEqual([
        { name: 'size', type: { kind: 'number' } },
        { name: 'report', type: { kind: 'callable', text: '(m: string) => void' } },
      ]);
    });

    it('VALID: {an optional callback the seam builds no value for} => dropped, so the entry is driven as maybe(11)', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'report', type: REPORT_TYPE, optional: true })];

      expect(appliedParamsTransformer({ params })).toStrictEqual([{ name: 'size', type: { kind: 'number' } }]);
    });

    // A rest parameter is never ALSO optional in a real walk (`param.isOptional()` and
    // `param.isRestParameter()` are independent ts-morph checks) — `rest` alone must trip the same
    // debt-free path `optional` does, on its own.
    it('VALID: {a rest array of callbacks, rest alone} => dropped, so the entry is driven as collect(11)', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'sinks', type: { kind: 'array', element: REPORT_TYPE }, rest: true })];

      expect(appliedParamsTransformer({ params })).toStrictEqual([{ name: 'size', type: { kind: 'number' } }]);
    });

    it('VALID: {an optional param the seam CAN build} => kept, because a real value spans real input breadth', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'retries', type: { kind: 'number' }, optional: true })];

      expect(appliedParamsTransformer({ params })).toStrictEqual([
        { name: 'size', type: { kind: 'number' } },
        { name: 'retries', type: { kind: 'number' }, optional: true },
      ]);
    });
  });

  // The interpreter applies an arrange POSITIONALLY, so a dropped parameter cannot be a hole: keeping the
  // fillable `retries` while dropping the `report` before it would hand `7` to `report`.
  describe('the truncation, not a filter', () => {
    it('VALID: {an unfillable optional followed by a fillable one} => both dropped, since a hole would shift the argument', () => {
      const params = [
        SIZE,
        ParamDescriptorStub({ name: 'report', type: REPORT_TYPE, optional: true }),
        ParamDescriptorStub({ name: 'retries', type: { kind: 'number' }, optional: true }),
      ];

      expect(appliedParamsTransformer({ params })).toStrictEqual([{ name: 'size', type: { kind: 'number' } }]);
    });
  });

  describe('an entry with no parameters', () => {
    it('EMPTY: {no params} => no applied params', () => {
      expect(appliedParamsTransformer({ params: [] })).toStrictEqual([]);
    });
  });

  // A trailing optional/rest parameter a harness ANSWERS is no longer unowed: the harness has already
  // paid the refusal, so truncating it here would throw that payment away before `cause-arrange` ever
  // sees it bound.
  describe('a trailing parameter a HARNESS answers', () => {
    it('VALID: {a rest array of callbacks the harness names} => kept, not truncated', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'sinks', type: { kind: 'array', element: REPORT_TYPE }, rest: true })];

      expect(appliedParamsTransformer({ params, harness: [SymbolNameStub({ value: 'sinks' })] })).toStrictEqual([
        { name: 'size', type: { kind: 'number' } },
        { name: 'sinks', type: { kind: 'array', element: { kind: 'callable', text: '(m: string) => void' } }, rest: true },
      ]);
    });

    it('VALID: {an optional callback the harness names} => kept, not truncated', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'report', type: REPORT_TYPE, optional: true })];

      expect(appliedParamsTransformer({ params, harness: [SymbolNameStub({ value: 'report' })] })).toStrictEqual([
        { name: 'size', type: { kind: 'number' } },
        { name: 'report', type: { kind: 'callable', text: '(m: string) => void' }, optional: true },
      ]);
    });

    it('VALID: {an unfillable optional followed by a fillable one, harness naming only the FIRST} => both kept', () => {
      const params = [
        SIZE,
        ParamDescriptorStub({ name: 'report', type: REPORT_TYPE, optional: true }),
        ParamDescriptorStub({ name: 'retries', type: { kind: 'number' }, optional: true }),
      ];

      expect(appliedParamsTransformer({ params, harness: [SymbolNameStub({ value: 'report' })] })).toStrictEqual([
        { name: 'size', type: { kind: 'number' } },
        { name: 'report', type: { kind: 'callable', text: '(m: string) => void' }, optional: true },
        { name: 'retries', type: { kind: 'number' }, optional: true },
      ]);
    });

    it('VALID: {a harness naming a DIFFERENT, unrelated param} => the unowed tail still truncates', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'report', type: REPORT_TYPE, optional: true })];

      expect(appliedParamsTransformer({ params, harness: [SymbolNameStub({ value: 'size' })] })).toStrictEqual([
        { name: 'size', type: { kind: 'number' } },
      ]);
    });

    it('EMPTY: {harness names nothing} => truncates exactly as with no harness at all', () => {
      const params = [SIZE, ParamDescriptorStub({ name: 'report', type: REPORT_TYPE, optional: true })];

      expect(appliedParamsTransformer({ params, harness: [] })).toStrictEqual([{ name: 'size', type: { kind: 'number' } }]);
    });
  });
});
