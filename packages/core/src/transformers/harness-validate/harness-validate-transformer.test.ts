import { DeclaringScopeStub } from '@assayer/shared/contracts/declaring-scope/declaring-scope.stub';
import { EntrySignatureStub } from '@assayer/shared/contracts/entry-signature/entry-signature.stub';
import { HarnessInputKeyStub } from '@assayer/shared/contracts/harness-input-key/harness-input-key.stub';
import { RelPathStub } from '@assayer/shared/contracts/rel-path/rel-path.stub';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

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

// `build` is no entry of its own — `analyze-file-broker`'s call graph folded it into `audit`'s own case
// set — so it reaches this validator ONLY through `FileAnalysis.declaringScopes`, never `entries`.
const BUILD_SCOPE = DeclaringScopeStub({
  name: 'build',
  hostEntry: 'audit',
  params: [{ name: 'report', type: { kind: 'callable', text: '(message: string) => string' } }],
});

describe('harnessValidateTransformer', () => {
  describe('a declaration that still names a refused parameter', () => {
    it('VALID: {audit.report, a callable Assayer refuses} => reports nothing', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub()],
        entries: [AUDIT_ENTRY],
        declaringScopes: [],
        suppliedTypes: [],
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
        declaringScopes: [],
        suppliedTypes: [],
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
        declaringScopes: [],
        suppliedTypes: [],
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
        declaringScopes: [],
        suppliedTypes: [],
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
        declaringScopes: [],
        suppliedTypes: [],
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
        declaringScopes: [],
        suppliedTypes: [],
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
        declaringScopes: [],
        suppliedTypes: [],
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

  describe('a declaration naming a DECLARING SCOPE — a funnelled private, not an entry', () => {
    // This is the exact key the input-gap invoice prints for a funnelled private's refusal
    // (`on \`build\``): `assayerHarness({ inputs: { build: { report: <value> } } })`. It validates
    // because `declaringScopes` carries `build` beside the file's real entries.
    it('VALID: {build.report, named only in declaringScopes} => reports nothing', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ entry: 'build', param: 'report' })],
        entries: [],
        declaringScopes: [BUILD_SCOPE],
        suppliedTypes: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('INVALID: {an unknown parameter on a declaring scope} => a P1 listing ITS OWN parameters, not the host\'s', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ entry: 'build', param: 'repot' })],
        entries: [AUDIT_ENTRY],
        declaringScopes: [BUILD_SCOPE],
        suppliedTypes: [],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `repot` on `build`, which is not a parameter of `build` in ' +
            '`src/audit.ts` — its parameters are `report`; did you mean `report`. Rename the key to the ' +
            'parameter the input gap names, or delete it.',
        },
      ]);
    });

    it('INVALID: {a typo naming neither a real entry nor a declaring scope} => a P1 suggesting the closest of BOTH', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ entry: 'buld', param: 'report' })],
        entries: [AUDIT_ENTRY],
        declaringScopes: [BUILD_SCOPE],
        suppliedTypes: [],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares inputs for `buld`, which `src/audit.ts` does not offer — its ' +
            'entries are `audit`, `build`; did you mean `build`. `inputs` is keyed by ENTRY name, then ' +
            'PARAMETER name, so rename the key to the entry that owes the input or delete it.',
        },
      ]);
    });
  });

  // The general form: a key survives all three name/fillability checks above, and only the VALUE
  // disagrees with the declared type. `undefined` reads as the opaque `unknown` kind, so it is
  // compatible with nothing except a declared type that is itself `unknown` — the ruling's own words.
  describe('a declaration whose VALUE disagrees with the declared type', () => {
    it('INVALID: {audit.report supplied as undefined} => a P1 naming the declared and supplied types', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub()],
        entries: [AUDIT_ENTRY],
        declaringScopes: [],
        suppliedTypes: [
          { entry: 'audit', param: 'report', type: TypeDescriptorStub({ kind: 'unknown', text: 'undefined' }) },
        ],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `report` on `audit`, but supplies a value of the wrong ' +
            "type. `src/audit.ts` declares `audit`'s `report` as `(message: string) => string`, and the value " +
            'supplied here is `undefined`. Supply a value of type `(message: string) => string` instead, or ' +
            "change `report`'s declared type in `src/audit.ts` if it is meant to accept `undefined`.",
        },
      ]);
    });

    // The named limit `is-type-compatible-guard`'s own doc states: `TypeDescriptor.callable` carries
    // only the checker's rendered TEXT, never a structural signature, so a callback of the WRONG arity
    // or parameter/return type still validates — this check closes `undefined`, a primitive, or a
    // composite standing in for a callback, never a callable-for-callable arity mismatch.
    it('VALID: {audit.report supplied as a callback of a DIFFERENT signature} => reports nothing (the known limit)', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub()],
        entries: [AUDIT_ENTRY],
        declaringScopes: [],
        suppliedTypes: [
          {
            entry: 'audit',
            param: 'report',
            type: TypeDescriptorStub({ kind: 'callable', text: '(n: number) => void' }),
          },
        ],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {audit.report supplied as a compatible callback} => reports nothing', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub()],
        entries: [AUDIT_ENTRY],
        declaringScopes: [],
        suppliedTypes: [
          {
            entry: 'audit',
            param: 'report',
            type: TypeDescriptorStub({ kind: 'callable', text: '(message: string) => string' }),
          },
        ],
      });

      expect(result).toStrictEqual([]);
    });

    // No fact was read for this key at all — the harness reader found no expression to type (a
    // computed key, say). Silently trusts the first three checks rather than inventing a mismatch.
    it('VALID: {no supplied-type fact for this key} => reports nothing', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub()],
        entries: [AUDIT_ENTRY],
        declaringScopes: [],
        suppliedTypes: [],
      });

      expect(result).toStrictEqual([]);
    });

    // A DECLARING SCOPE's own refusal takes the same check — the invoice reads `on \`build\`` and the
    // key names `build`, never `audit`, so the type fact has to be looked up under the SAME name.
    it('INVALID: {build.report supplied as undefined, a DECLARING SCOPE} => a P1 naming the funnelled scope', () => {
      const result = harnessValidateTransformer({
        relPath: HARNESS,
        targetRelPath: TARGET,
        keys: [HarnessInputKeyStub({ entry: 'build', param: 'report' })],
        entries: [],
        declaringScopes: [BUILD_SCOPE],
        suppliedTypes: [
          { entry: 'build', param: 'report', type: TypeDescriptorStub({ kind: 'unknown', text: 'undefined' }) },
        ],
      });

      expect(result).toStrictEqual([
        {
          relPath: 'src/audit.harness.ts',
          line: 1,
          column: 1,
          message:
            '`src/audit.harness.ts` declares an input `report` on `build`, but supplies a value of the wrong ' +
            "type. `src/audit.ts` declares `build`'s `report` as `(message: string) => string`, and the value " +
            'supplied here is `undefined`. Supply a value of type `(message: string) => string` instead, or ' +
            "change `report`'s declared type in `src/audit.ts` if it is meant to accept `undefined`.",
        },
      ]);
    });
  });
});
