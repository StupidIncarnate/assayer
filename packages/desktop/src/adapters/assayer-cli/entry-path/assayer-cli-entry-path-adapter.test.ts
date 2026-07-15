import { filePathContract } from '@assayer/core/contracts';

import { assayerCliEntryPathAdapter } from './assayer-cli-entry-path-adapter';
import { assayerCliEntryPathAdapterProxy } from './assayer-cli-entry-path-adapter.proxy';

describe('assayerCliEntryPathAdapter', () => {
  describe('finding the built CLI', () => {
    // Walks up from THIS file to the monorepo root, which is what makes the lookup work from src and
    // from dist alike.
    it('VALID: {from this adapter} => the built CLI entry', () => {
      assayerCliEntryPathAdapterProxy();

      const result = assayerCliEntryPathAdapter();

      expect(String(result).endsWith('/packages/cli/dist/bin/assayer.js')).toBe(true);
    });
  });

  describe('no CLI above', () => {
    // Undefined rather than a plausible-looking path: the caller has to say "the CLI is not built"
    // instead of spawning nothing and reporting a run that never happened.
    it('EMPTY: {a root with no assayer above it} => undefined', () => {
      assayerCliEntryPathAdapterProxy();

      const result = assayerCliEntryPathAdapter({ from: filePathContract.parse('/tmp') });

      expect(result).toBe(undefined);
    });
  });
});
