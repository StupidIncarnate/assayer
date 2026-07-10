import { isSourceFileIncludedGuard } from './is-source-file-included-guard';

describe('isSourceFileIncludedGuard', () => {
  it("VALID: {relPath: 'packages/web/src/app.tsx', exclude: ['**/generated/**']} => returns true", () => {
    const result = isSourceFileIncludedGuard({
      relPath: 'packages/web/src/app.tsx',
      exclude: ['**/generated/**'],
    });

    expect(result).toBe(true);
  });

  it('EMPTY: {} => returns false', () => {
    const result = isSourceFileIncludedGuard({});

    expect(result).toBe(false);
  });

  it("INVALID: {relPath: 'node_modules/foo/index.ts'} => returns false", () => {
    const result = isSourceFileIncludedGuard({ relPath: 'node_modules/foo/index.ts' });

    expect(result).toBe(false);
  });

  it("INVALID: {relPath: 'packages/web/src/app.test.ts'} => returns false", () => {
    const result = isSourceFileIncludedGuard({ relPath: 'packages/web/src/app.test.ts' });

    expect(result).toBe(false);
  });

  it("INVALID: {relPath: 'packages/web/src/notes.md'} => returns false", () => {
    const result = isSourceFileIncludedGuard({ relPath: 'packages/web/src/notes.md' });

    expect(result).toBe(false);
  });

  it("INVALID: {relPath: 'packages/web/generated/foo.ts', exclude: ['**/generated/**']} => returns false", () => {
    const result = isSourceFileIncludedGuard({
      relPath: 'packages/web/generated/foo.ts',
      exclude: ['**/generated/**'],
    });

    expect(result).toBe(false);
  });
});
