import { harnessKeyPathContract } from '@assayer/shared/contracts';

import { harnessValueTransformer } from './harness-value-transformer';

// Opaque sentinels. The transformer never inspects a declared value — what a real harness registers is
// a callback or an instance — so a distinguishable marker is all a lookup assertion needs.
const REPORT = 'the-report-value';
const OTHER = 'the-other-value';

describe('harnessValueTransformer', () => {
  describe('a key the harness declared', () => {
    it('VALID: {inputs.audit.report} => the registered value', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { report: REPORT } } }],
        key: harnessKeyPathContract.parse('inputs.audit.report'),
      });

      expect(result).toStrictEqual({ found: true, value: 'the-report-value' });
    });

    it('VALID: {a key declared as undefined} => found, since an explicit undefined is a supplied value', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { report: undefined } } }],
        key: harnessKeyPathContract.parse('inputs.audit.report'),
      });

      expect(result).toStrictEqual({ found: true, value: undefined });
    });

    it('VALID: {two declarations of one key} => the LAST one, the call the author left in force', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { report: REPORT } } }, { inputs: { audit: { report: OTHER } } }],
        key: harnessKeyPathContract.parse('inputs.audit.report'),
      });

      expect(result).toStrictEqual({ found: true, value: 'the-other-value' });
    });

    it('VALID: {two declarations of different entries} => each key resolves against its own declaration', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { report: REPORT } } }, { inputs: { tally: { emit: OTHER } } }],
        key: harnessKeyPathContract.parse('inputs.tally.emit'),
      });

      expect(result).toStrictEqual({ found: true, value: 'the-other-value' });
    });
  });

  describe('a key nothing declared', () => {
    it('EMPTY: {no declarations} => not found', () => {
      const result = harnessValueTransformer({
        declarations: [],
        key: harnessKeyPathContract.parse('inputs.audit.report'),
      });

      expect(result).toStrictEqual({ found: false });
    });

    it('INVALID: {the entry is declared, the parameter is not} => not found', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { emit: REPORT } } }],
        key: harnessKeyPathContract.parse('inputs.audit.report'),
      });

      expect(result).toStrictEqual({ found: false });
    });

    it('INVALID: {an entry nothing declared} => not found', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { tally: { report: REPORT } } }],
        key: harnessKeyPathContract.parse('inputs.audit.report'),
      });

      expect(result).toStrictEqual({ found: false });
    });
  });

  describe('a key path that is not a declared-input route', () => {
    it('INVALID: {a path rooted elsewhere} => not found', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { report: REPORT } } }],
        key: harnessKeyPathContract.parse('states.audit.report'),
      });

      expect(result).toStrictEqual({ found: false });
    });

    it('INVALID: {a two-segment path} => not found, since it names no parameter', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { report: REPORT } } }],
        key: harnessKeyPathContract.parse('inputs.audit'),
      });

      expect(result).toStrictEqual({ found: false });
    });

    it('INVALID: {a four-segment path} => not found, since inputs nest exactly two deep', () => {
      const result = harnessValueTransformer({
        declarations: [{ inputs: { audit: { report: REPORT } } }],
        key: harnessKeyPathContract.parse('inputs.audit.report.extra'),
      });

      expect(result).toStrictEqual({ found: false });
    });
  });
});
