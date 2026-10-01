import { ScriptTarget } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { harnessValueTypesTransformer } from './harness-value-types-transformer';
import { harnessValueTypesTransformerProxy } from './harness-value-types-transformer.proxy';

describe('harnessValueTypesTransformer', () => {
  // The harness is read under the analysis options of the tsconfig that owns it, so a value whose type
  // depends on the library set reads the way the harness's own compile reads it.
  describe('the owning tsconfig compiler options', () => {
    const source = [
      "import { assayerHarness } from '@assayer/core';",
      '',
      'assayerHarness({ inputs: { tally: { last: [1, 2].at(-1) } } });',
    ].join('\n');

    it('VALID: {last: [1, 2].at(-1), no compiler options} => the default library has no `at`, so the type is any', () => {
      harnessValueTypesTransformerProxy();

      expect(harnessValueTypesTransformer({ source, fileName: 'src/tally.harness.ts' })).toStrictEqual([
        { entry: 'tally', param: 'last', type: { kind: 'unknown', text: 'any' } },
      ]);
    });

    it('VALID: {last: [1, 2].at(-1), target ES2022} => number or undefined, with strictNullChecks forced on', () => {
      harnessValueTypesTransformerProxy();

      expect(
        harnessValueTypesTransformer({
          source,
          fileName: 'src/tally.harness.ts',
          compilerOptions: CompilerOptionsStub({ target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] }),
        }),
      ).toStrictEqual([
        {
          entry: 'tally',
          param: 'last',
          type: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
        },
      ]);
    });
  });

  describe('a plain property value', () => {
    it('VALID: {report: undefined} => one entry naming its opaque "undefined" type', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: undefined } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'unknown', text: 'undefined' } },
      ]);
    });

    it('VALID: {report: an arrow function} => one entry naming its callable type', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: (message: string): string => message } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
      ]);
    });

    // The repro this closes: a callback of the WRONG signature must read as its OWN signature, distinct
    // from the declared one — never collapsed to a generic "callable" that hides the mismatch.
    it('VALID: {report: an arrow function of a DIFFERENT signature} => the callable type it actually is', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: (n: number): void => {} } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(n: number) => void' } },
      ]);
    });
  });

  describe('a trailing rest parameter supplied as an array', () => {
    it('VALID: {sinks: [an arrow function]} => an array-of-callable type', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { collect: { sinks: [(message: string): void => {}] } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/collect.harness.ts' })).toStrictEqual([
        {
          entry: 'collect',
          param: 'sinks',
          type: { kind: 'array', element: { kind: 'callable', text: '(message: string) => void' } },
        },
      ]);
    });
  });

  describe('a shorthand property', () => {
    it('VALID: {{ report }} => the bound identifier\'s own type', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        "const report = (message: string): string => message;",
        'assayerHarness({ inputs: { audit: { report } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
      ]);
    });
  });

  describe('a method-shorthand property', () => {
    it('VALID: {{ report(m) {...} }} => the method\'s own callable type', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report(message: string): string { return message; } } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
      ]);
    });
  });

  describe('several entries and several calls', () => {
    it('VALID: {two params on one entry} => one record per param', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { record: { log: (m: string): string => m, sink: (m: string): string => m } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/record.harness.ts' })).toStrictEqual([
        { entry: 'record', param: 'log', type: { kind: 'callable', text: '(m: string) => string' } },
        { entry: 'record', param: 'sink', type: { kind: 'callable', text: '(m: string) => string' } },
      ]);
    });

    it('VALID: {two separate assayerHarness calls} => both fold into one list', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: undefined } } });',
        'assayerHarness({ inputs: { band: { cb: (x: number): number => x } } });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/multi.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'unknown', text: 'undefined' } },
        { entry: 'band', param: 'cb', type: { kind: 'callable', text: '(x: number) => number' } },
      ]);
    });
  });

  describe('nothing declared', () => {
    it('EMPTY: {no assayerHarness call} => no records', () => {
      harnessValueTypesTransformerProxy();
      const source = "export const notAHarness = 1;\n";

      expect(harnessValueTypesTransformer({ source, fileName: 'src/plain.ts' })).toStrictEqual([]);
    });

    it('EMPTY: {assayerHarness({ inputs: {} })} => no records', () => {
      harnessValueTypesTransformerProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: {} });',
      ].join('\n');

      expect(harnessValueTypesTransformer({ source, fileName: 'src/empty.harness.ts' })).toStrictEqual([]);
    });
  });
});
