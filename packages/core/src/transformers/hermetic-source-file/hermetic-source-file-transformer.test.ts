import { hermeticSourceFileTransformer } from './hermetic-source-file-transformer';

describe('hermeticSourceFileTransformer', () => {
  describe('reading the parsed file', () => {
    it('VALID: {a source declaring one const} => returns what read computes from the parsed file', () => {
      const result = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/count.ts',
        source: 'export const count = 1;\n',
        read: ({ sourceFile }) => sourceFile.getVariableDeclarations().map((declaration) => declaration.getName()),
      });

      expect(result).toStrictEqual(['count']);
    });

    it('VALID: {a lib type in the source} => the checker resolves it through the lib files', () => {
      const result = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/lib-type.ts',
        source: 'export const parsed = Number("1");\n',
        read: ({ sourceFile }) => sourceFile.getVariableDeclarationOrThrow('parsed').getType().getText(),
      });

      expect(result).toBe('number');
    });
  });

  describe('independence between calls', () => {
    it('VALID: {a call declaring a global, then a call naming it} => the second call does not see the global', () => {
      hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/declares.ts',
        source: 'declare global {\n  var limit: number;\n}\nexport {};\n',
        read: ({ sourceFile }) => sourceFile.getFilePath(),
      });

      const result = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/reads.ts',
        source: 'export const seen = limit;\n',
        read: ({ sourceFile }) => sourceFile.getVariableDeclarationOrThrow('seen').getType().getText(),
      });

      expect(result).toBe('any');
    });

    it('VALID: {a call while read runs} => the project holds only the file of the current call', () => {
      const result = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/only.ts',
        source: 'export {};\n',
        read: ({ sourceFile }) => sourceFile.getProject().getSourceFiles().map((file) => file.getFilePath()),
      });

      expect(result).toStrictEqual(['/src/only.ts']);
    });

    it('VALID: {the same path parsed twice with different sources} => each call reads its own source', () => {
      const first = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/same.ts',
        source: 'export const first = 1;\n',
        read: ({ sourceFile }) => sourceFile.getVariableDeclarations().map((declaration) => declaration.getName()),
      });
      const second = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/same.ts',
        source: 'export const second = 2;\n',
        read: ({ sourceFile }) => sourceFile.getVariableDeclarations().map((declaration) => declaration.getName()),
      });

      expect({ first, second }).toStrictEqual({ first: ['first'], second: ['second'] });
    });

    it('ERROR: {read throws} => the error reaches the caller and the file is still removed', () => {
      expect(() =>
        hermeticSourceFileTransformer({
          compilerOptions: { strictNullChecks: true },
          relPath: 'src/throws.ts',
          source: 'export {};\n',
          read: ({ sourceFile }) => sourceFile.getVariableDeclarationOrThrow('missing').getName(),
        }),
      ).toThrow(/^Expected to find variable declaration named 'missing'\.$/u);

      const result = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/throws.ts',
        source: 'export const after = 1;\n',
        read: ({ sourceFile }) => sourceFile.getProject().getSourceFiles().map((file) => file.getFilePath()),
      });

      expect(result).toStrictEqual(['/src/throws.ts']);
    });

    it('EDGE: {a call made from inside another call read} => the inner call sees only its own file', () => {
      const result = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/outer.ts',
        source: 'declare global {\n  var outerOnly: number;\n}\nexport {};\n',
        read: () =>
          hermeticSourceFileTransformer({
            compilerOptions: { strictNullChecks: true },
            relPath: 'src/inner.ts',
            source: 'export const seen = outerOnly;\n',
            read: ({ sourceFile }) => ({
              files: sourceFile.getProject().getSourceFiles().map((file) => file.getFilePath()),
              type: sourceFile.getVariableDeclarationOrThrow('seen').getType().getText(),
            }),
          }),
      });

      expect(result).toStrictEqual({ files: ['/src/inner.ts'], type: 'any' });
    });
  });

  describe('compiler options', () => {
    it('VALID: {strictNullChecks on, then the same source with default options} => each option set reads with its own checker', () => {
      const source = 'export const maybe: string | undefined = undefined as string | undefined;\n';

      const strict = hermeticSourceFileTransformer({
        compilerOptions: { strictNullChecks: true },
        relPath: 'src/maybe.ts',
        source,
        read: ({ sourceFile }) => sourceFile.getVariableDeclarationOrThrow('maybe').getType().getText(),
      });
      const loose = hermeticSourceFileTransformer({
        compilerOptions: {},
        relPath: 'src/maybe.ts',
        source,
        read: ({ sourceFile }) => sourceFile.getVariableDeclarationOrThrow('maybe').getType().getText(),
      });

      expect({ strict, loose }).toStrictEqual({ strict: 'string | undefined', loose: 'string' });
    });
  });
});
