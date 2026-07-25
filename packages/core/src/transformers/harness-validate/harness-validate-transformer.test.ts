import { EntrySignatureStub, HarnessInputKeyStub, RelPathStub } from '@assayer/shared/contracts';

import { harnessValidateTransformer } from './harness-validate-transformer';

const HARNESS = RelPathStub({ value: 'src/audit.harness.ts' });
const TARGET = RelPathStub({ value: 'src/audit.ts' });

const AUDIT_ENTRY = EntrySignatureStub({
  name: 'audit',
  scopePath: ['*module*', 'audit'],
  params: [
    { name: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
    { name: 'size', type: { kind: 'number' } },
  ],
  returnType: { kind: 'string' },
  line: 3,
  access: { kind: 'named' },
});

const MODULE_ENTRY = EntrySignatureStub({
  name: '*module*',
  scopePath: ['*module*'],
  params: [],
  returnType: { kind: 'unknown', text: 'void' },
  line: 1,
  access: { kind: 'module' },
});

const EMIT_ENTRY = EntrySignatureStub({
  name: 'emit',
  scopePath: ['*module*', 'emit'],
  params: [],
  returnType: { kind: 'unknown', text: 'void' },
  line: 8,
  access: { kind: 'named' },
});

describe('harnessValidateTransformer', () => {
  describe('a declaration that still names a refused parameter', () => {
    it('VALID: {audit.report, a callable Assayer refuses} => reports nothing', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub()],
        entries: [AUDIT_ENTRY],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a declaration that closes nothing', () => {
    it('EMPTY: {no keys} => a P1 saying the file closes nothing', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [],
        entries: [AUDIT_ENTRY],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares no inputs, so it closes nothing. A harness exists only to supply ' +
            'values Assayer refused to construct: take the input gap reported against `src/audit.ts` and declare ' +
            'the parameter it names — `assayerHarness({ inputs: { <entry>: { <parameter>: <value> } } })`. If ' +
            '`src/audit.ts` has no input gap, this file has nothing to close and belongs deleted.',
        },
      ]);
    });
  });

  describe('a declaration naming something the file does not have', () => {
    it('INVALID: {an unknown entry} => a P1 listing the entries and suggesting the closest', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ entry: 'audot' })],
        entries: [AUDIT_ENTRY],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares inputs for `audot`, which `src/audit.ts` does not offer — its ' +
            'entries are `audit`; did you mean `audit`. `inputs` is keyed by ENTRY name, then PARAMETER name, so ' +
            'rename the key to the entry that owes the input or delete it.',
        },
      ]);
    });

    it('INVALID: {an unknown parameter} => a P1 listing the parameters and suggesting the closest', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ param: 'repot' })],
        entries: [AUDIT_ENTRY],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `repot` on `audit`, which is not a parameter of `audit` in ' +
            '`src/audit.ts` — its parameters are `report`, `size`; did you mean `report`. Rename the key to the ' +
            'parameter the input gap names, or delete it.',
        },
      ]);
    });

    it('INVALID: {an unknown parameter on an entry with no parameters} => a P1 saying the entry takes no parameters', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ entry: 'emit', param: 'anything' })],
        entries: [EMIT_ENTRY],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `anything` on `emit`, which is not a parameter of `emit` in ' +
            '`src/audit.ts` — it takes no parameters. Rename the key to the parameter the input gap names, or ' +
            'delete it.',
        },
      ]);
    });

    it('INVALID: {a MODULE scope named as an entry} => a P1 saying the file offers no callable entries', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ entry: '*module*' })],
        entries: [MODULE_ENTRY],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares inputs for `*module*`, which `src/audit.ts` does not offer — it has ' +
            'no callable entries. `inputs` is keyed by ENTRY name, then PARAMETER name, so rename the key to the ' +
            'entry that owes the input or delete it.',
        },
      ]);
    });
  });

  describe('a declaration naming a parameter Assayer builds itself', () => {
    it('INVALID: {audit.size, a number} => a P1 saying the harness does not own it', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ param: 'size' })],
        entries: [AUDIT_ENTRY],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `size` on `audit`, a parameter Assayer builds itself from ' +
            'its declared type — no input gap was raised for it. A harness is GAP-FILL: a value here would ' +
            'silently displace the derived one, so a reader could no longer tell which value their case ran ' +
            'with. Delete this key; only a parameter `src/audit.ts` is invoiced for belongs here.',
        },
      ]);
    });
  });
});
