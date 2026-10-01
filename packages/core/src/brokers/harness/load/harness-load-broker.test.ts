import { harnessLoadBroker } from './harness-load-broker';
import { harnessLoadBrokerProxy } from './harness-load-broker.proxy';

const REGISTERS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({',
  '  inputs: {',
  '    audit: { report: (message: string): string => message },',
  '  },',
  '});',
].join('\n');

const EVALUATES = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  "assayerHarness({ inputs: { audit: { report: ['a', 'b'].join('-') } } });",
].join('\n');

const TWO_CALLS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { report: (m: string): string => m } } });',
  'assayerHarness({ inputs: { collect: { sink: (m: string): string => m } } });',
].join('\n');

const NEVER_CALLED = ["import { assayerHarness } from '@assayer/core';", '', 'const unused = assayerHarness;'].join('\n');

const THROWS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'const boom = (): string => { throw new Error("the harness blew up"); };',
  'assayerHarness({ inputs: { audit: { report: boom() } } });',
].join('\n');

const IMPORTS_FS = [
  "import { readFileSync } from 'node:fs';",
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { report: readFileSync } } });',
].join('\n');

const READS_PROCESS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { report: typeof process } } });',
].join('\n');

const IMPORTS_SUBPATH = [
  "import { assayerHarness } from '@assayer/core/index';",
  '',
  'assayerHarness({ inputs: { audit: { report: (message: string): string => message } } });',
].join('\n');

describe('harnessLoadBroker', () => {
  describe('reading a harness by running it', () => {
    it('VALID: {one assayerHarness call} => returns the declaration it registered', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: REGISTERS, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({ ok: true, declarations: [{ inputs: { audit: { report: expect.any(Function) } } }] });
    });

    it('VALID: {a value the module body computes} => registers the evaluated result, not its source', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: EVALUATES, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({ ok: true, declarations: [{ inputs: { audit: { report: 'a-b' } } }] });
    });

    it('VALID: {two assayerHarness calls} => returns both declarations in call order', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: TWO_CALLS, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({
        ok: true,
        declarations: [
          { inputs: { audit: { report: expect.any(Function) } } },
          { inputs: { collect: { sink: expect.any(Function) } } },
        ],
      });
    });

    it('EMPTY: {imported but never called} => returns no declarations', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: NEVER_CALLED, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({ ok: true, declarations: [] });
    });

    it('VALID: {an import of a subpath under @assayer/core} => still resolves to the registrar', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: IMPORTS_SUBPATH, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({ ok: true, declarations: [{ inputs: { audit: { report: expect.any(Function) } } }] });
    });
  });

  describe('a harness the loader cannot read', () => {
    it('ERROR: {the module body throws} => returns the thrown message', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: THROWS, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({ ok: false, message: 'the harness blew up' });
    });

    it('ERROR: {a value import of node:fs} => refuses the import by name', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: IMPORTS_FS, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({
        ok: false,
        message:
          "a harness may import only '@assayer/core', and this one imports 'node:fs'. Declare the value " +
          'inline in the `inputs` map instead — a harness is read by being run, so anything it imports ' +
          'would run during a compile.',
      });
    });
  });

  describe('sandbox isolation', () => {
    it('VALID: {a harness reading process} => sees no host global', () => {
      harnessLoadBrokerProxy();

      const result = harnessLoadBroker({ source: READS_PROCESS, fileName: 'src/audit.harness.ts' });

      expect(result).toStrictEqual({ ok: true, declarations: [{ inputs: { audit: { report: 'undefined' } } }] });
    });
  });
});
