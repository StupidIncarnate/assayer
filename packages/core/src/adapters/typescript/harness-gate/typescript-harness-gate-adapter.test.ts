import { typescriptHarnessGateAdapter } from './typescript-harness-gate-adapter';
import { typescriptHarnessGateAdapterProxy } from './typescript-harness-gate-adapter.proxy';

const REGISTERS = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'assayerHarness({ inputs: { audit: { report: (message: string): string => message } } });',
].join('\n');

const RENAMED = [
  "import { assayerHarness as declare } from '@assayer/core';",
  '',
  'declare({ inputs: { audit: { report: (message: string): string => message } } });',
].join('\n');

const NAMESPACED = [
  "import * as assayer from '@assayer/core';",
  '',
  'assayer.assayerHarness({ inputs: { audit: { report: (message: string): string => message } } });',
].join('\n');

const SUBPATH = [
  "import { assayerHarness } from '@assayer/core/transformers';",
  '',
  'assayerHarness({ inputs: { audit: { report: (message: string): string => message } } });',
].join('\n');

const PLAYWRIGHT_HARNESS = [
  "import { chromium } from 'playwright';",
  '',
  'export const smokeRepoAppHarness = (): number => chromium.name.length;',
].join('\n');

const IMPORTED_NEVER_CALLED = ["import { assayerHarness } from '@assayer/core';", '', 'export const x = 1;'].join('\n');

const OTHER_PACKAGE = [
  "import { assayerHarness } from '@assayer/core-lookalike';",
  '',
  'assayerHarness({ inputs: {} });',
].join('\n');

const SHADOWED = [
  "import { chromium } from 'playwright';",
  '',
  'const assayerHarness = (): number => chromium.name.length;',
  'assayerHarness();',
].join('\n');

describe('typescriptHarnessGateAdapter', () => {
  describe('a file that registers with Assayer', () => {
    it('VALID: {imports assayerHarness from @assayer/core and calls it} => returns true', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: REGISTERS })).toBe(true);
    });

    it('VALID: {imported under a different local name and called by it} => returns true', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: RENAMED })).toBe(true);
    });

    it('VALID: {namespace import called as core.assayerHarness} => returns true', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: NAMESPACED })).toBe(true);
    });

    it('VALID: {imported from an @assayer/core subpath} => returns true', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: SUBPATH })).toBe(true);
    });
  });

  describe('a file the gate must leave alone', () => {
    it('VALID: {a Playwright harness with the same filename shape} => returns false', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: PLAYWRIGHT_HARNESS })).toBe(false);
    });

    it('VALID: {imports assayerHarness but never calls it} => returns false', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: IMPORTED_NEVER_CALLED })).toBe(false);
    });

    it('VALID: {the same symbol name from a different package} => returns false', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: OTHER_PACKAGE })).toBe(false);
    });

    it('VALID: {a local binding that merely shares the name} => returns false', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: SHADOWED })).toBe(false);
    });

    it('EMPTY: {an empty file} => returns false', () => {
      typescriptHarnessGateAdapterProxy();

      expect(typescriptHarnessGateAdapter({ source: '' })).toBe(false);
    });
  });
});
