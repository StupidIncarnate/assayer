import { analyzerHashStatics } from '../../statics/analyzer-hash/analyzer-hash-statics';
import { isAnalyzerCodeFileGuard } from './is-analyzer-code-file-guard';

const TEST_SUPPORT_FILES = analyzerHashStatics.source.testSupportInfixes.map(
  (infix) => `brokers/user/fetch/user-fetch-broker${infix}ts`,
);
const SCRATCH_FILES = analyzerHashStatics.source.scratchFolders.map((folder) => `${folder}/leftover.ts`);

describe('isAnalyzerCodeFileGuard', () => {
  describe('a source root', () => {
    it("VALID: {relPath: 'brokers/user/fetch/user-fetch-broker.ts', tree: 'source'} => returns true", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'brokers/user/fetch/user-fetch-broker.ts', tree: 'source' })).toBe(
        true,
      );
    });

    it("VALID: {relPath: 'widgets/panel/panel-widget.tsx', tree: 'source'} => returns true", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'widgets/panel/panel-widget.tsx', tree: 'source' })).toBe(true);
    });

    it.each(TEST_SUPPORT_FILES)("INVALID: {relPath: %s, tree: 'source'} => returns false", (relPath) => {
      expect(isAnalyzerCodeFileGuard({ relPath, tree: 'source' })).toBe(false);
    });

    it.each(SCRATCH_FILES)("INVALID: {relPath: %s, tree: 'source'} => returns false", (relPath) => {
      expect(isAnalyzerCodeFileGuard({ relPath, tree: 'source' })).toBe(false);
    });

    it("INVALID: {relPath: 'brokers/user/fetch/user-fetch-broker.test.ts', tree: 'source'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'brokers/user/fetch/user-fetch-broker.test.ts', tree: 'source' })).toBe(
        false,
      );
    });

    it("INVALID: {relPath: 'src/audit.harness.ts', tree: 'source'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'src/audit.harness.ts', tree: 'source' })).toBe(false);
    });

    it("INVALID: {relPath: 'globals.d.ts', tree: 'source'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'globals.d.ts', tree: 'source' })).toBe(false);
    });

    it("INVALID: {relPath: 'probe-runtime.js', tree: 'source'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'probe-runtime.js', tree: 'source' })).toBe(false);
    });

    it("INVALID: {relPath: 'node_modules/zod/index.ts', tree: 'source'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'node_modules/zod/index.ts', tree: 'source' })).toBe(false);
    });
  });

  describe('a dist root', () => {
    it("VALID: {relPath: 'src/brokers/user/fetch/user-fetch-broker.js', tree: 'dist'} => returns true", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'src/brokers/user/fetch/user-fetch-broker.js', tree: 'dist' })).toBe(
        true,
      );
    });

    it("INVALID: {relPath: 'src/brokers/user/fetch/user-fetch-broker.d.ts', tree: 'dist'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'src/brokers/user/fetch/user-fetch-broker.d.ts', tree: 'dist' })).toBe(
        false,
      );
    });

    it("INVALID: {relPath: 'src/brokers/user/fetch/user-fetch-broker.js.map', tree: 'dist'} => returns false", () => {
      expect(
        isAnalyzerCodeFileGuard({ relPath: 'src/brokers/user/fetch/user-fetch-broker.js.map', tree: 'dist' }),
      ).toBe(false);
    });

    it("INVALID: {relPath: 'node_modules/zod/index.js', tree: 'dist'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'node_modules/zod/index.js', tree: 'dist' })).toBe(false);
    });
  });

  describe('missing inputs', () => {
    it("EMPTY: {tree: 'source'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ tree: 'source' })).toBe(false);
    });

    it("EMPTY: {relPath: 'index.ts'} => returns false", () => {
      expect(isAnalyzerCodeFileGuard({ relPath: 'index.ts' })).toBe(false);
    });
  });
});
