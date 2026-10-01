import { isAssayerHarnessGuard } from './is-assayer-harness-guard';
import { isAssayerHarnessGuardProxy } from './is-assayer-harness-guard.proxy';

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

const WRONG_NAME_SAME_PACKAGE = ["import { otherExport } from '@assayer/core';", '', 'otherExport();'].join('\n');

const ASSIGNED_NOT_A_BARE_STATEMENT = [
  "import { assayerHarness } from '@assayer/core';",
  '',
  'const result = assayerHarness({ inputs: {} });',
].join('\n');

describe('isAssayerHarnessGuard', () => {
  describe('a file that registers with Assayer', () => {
    it('VALID: {imports assayerHarness from @assayer/core and calls it} => returns true', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: REGISTERS })).toBe(true);
    });

    it('VALID: {imported under a different local name and called by it} => returns true', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: RENAMED })).toBe(true);
    });

    it('VALID: {namespace import called as core.assayerHarness} => returns true', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: NAMESPACED })).toBe(true);
    });

    it('VALID: {imported from an @assayer/core subpath} => returns true', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: SUBPATH })).toBe(true);
    });
  });

  describe('a file the gate must leave alone', () => {
    it('VALID: {a Playwright harness with the same filename shape} => returns false', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: PLAYWRIGHT_HARNESS })).toBe(false);
    });

    it('VALID: {imports assayerHarness but never calls it} => returns false', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: IMPORTED_NEVER_CALLED })).toBe(false);
    });

    it('VALID: {the same symbol name from a different package} => returns false', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: OTHER_PACKAGE })).toBe(false);
    });

    it('VALID: {a local binding that merely shares the name} => returns false', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: SHADOWED })).toBe(false);
    });

    it('VALID: {a different symbol imported from @assayer/core and called} => returns false', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: WRONG_NAME_SAME_PACKAGE })).toBe(false);
    });

    it('VALID: {assayerHarness imported and called, but its result is assigned rather than a bare statement} => returns false', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: ASSIGNED_NOT_A_BARE_STATEMENT })).toBe(false);
    });

    it('EMPTY: {an empty file} => returns false', () => {
      isAssayerHarnessGuardProxy();

      expect(isAssayerHarnessGuard({ source: '' })).toBe(false);
    });
  });
});
