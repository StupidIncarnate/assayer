import { tsMorphReadHarnessValueTypesAdapter } from './ts-morph-read-harness-value-types-adapter';
import { tsMorphReadHarnessValueTypesAdapterProxy } from './ts-morph-read-harness-value-types-adapter.proxy';

describe('tsMorphReadHarnessValueTypesAdapter', () => {
  describe('a plain property value', () => {
    it('VALID: {report: undefined} => one entry naming its opaque "undefined" type', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: undefined } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'unknown', text: 'undefined' } },
      ]);
    });

    it('VALID: {report: an arrow function} => one entry naming its callable type', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: (message: string): string => message } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
      ]);
    });

    // The repro this closes: a callback of the WRONG signature must read as its OWN signature, distinct
    // from the declared one — never collapsed to a generic "callable" that hides the mismatch.
    it('VALID: {report: an arrow function of a DIFFERENT signature} => the callable type it actually is', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: (n: number): void => {} } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(n: number) => void' } },
      ]);
    });
  });

  describe('a trailing rest parameter supplied as an array', () => {
    it('VALID: {sinks: [an arrow function]} => an array-of-callable type', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { collect: { sinks: [(message: string): void => {}] } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/collect.harness.ts' })).toStrictEqual([
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
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        "const report = (message: string): string => message;",
        'assayerHarness({ inputs: { audit: { report } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
      ]);
    });
  });

  describe('a method-shorthand property', () => {
    it('VALID: {{ report(m) {...} }} => the method\'s own callable type', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report(message: string): string { return message; } } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/audit.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'callable', text: '(message: string) => string' } },
      ]);
    });
  });

  describe('several entries and several calls', () => {
    it('VALID: {two params on one entry} => one record per param', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { record: { log: (m: string): string => m, sink: (m: string): string => m } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/record.harness.ts' })).toStrictEqual([
        { entry: 'record', param: 'log', type: { kind: 'callable', text: '(m: string) => string' } },
        { entry: 'record', param: 'sink', type: { kind: 'callable', text: '(m: string) => string' } },
      ]);
    });

    it('VALID: {two separate assayerHarness calls} => both fold into one list', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: { audit: { report: undefined } } });',
        'assayerHarness({ inputs: { band: { cb: (x: number): number => x } } });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/multi.harness.ts' })).toStrictEqual([
        { entry: 'audit', param: 'report', type: { kind: 'unknown', text: 'undefined' } },
        { entry: 'band', param: 'cb', type: { kind: 'callable', text: '(x: number) => number' } },
      ]);
    });
  });

  describe('nothing declared', () => {
    it('EMPTY: {no assayerHarness call} => no records', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = "export const notAHarness = 1;\n";

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/plain.ts' })).toStrictEqual([]);
    });

    it('EMPTY: {assayerHarness({ inputs: {} })} => no records', () => {
      tsMorphReadHarnessValueTypesAdapterProxy();
      const source = [
        "import { assayerHarness } from '@assayer/core';",
        '',
        'assayerHarness({ inputs: {} });',
      ].join('\n');

      expect(tsMorphReadHarnessValueTypesAdapter({ source, fileName: 'src/empty.harness.ts' })).toStrictEqual([]);
    });
  });
});
