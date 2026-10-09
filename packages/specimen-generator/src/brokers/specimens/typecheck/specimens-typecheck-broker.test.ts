import { GeneratedFileStub } from '../../../contracts/generated-file/generated-file.stub';
import { specimensTypecheckBroker } from './specimens-typecheck-broker';
import { specimensTypecheckBrokerProxy } from './specimens-typecheck-broker.proxy';

describe('specimensTypecheckBroker', () => {
  describe('clean files', () => {
    it('VALID: {one clean specimen} => returns no errors', () => {
      specimensTypecheckBrokerProxy();
      const files = [
        GeneratedFileStub({
          relPath: 'src/if/clean/clean.ts',
          content: 'export const clean = (value: number): number => value + 1;\n',
        }),
      ];

      const result = specimensTypecheckBroker({ files });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {files: []} => returns no errors', () => {
      specimensTypecheckBrokerProxy();

      const result = specimensTypecheckBroker({ files: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('rejected files', () => {
    it('INVALID: {an unused local} => returns the unused-variable message for that file only', () => {
      specimensTypecheckBrokerProxy();
      const files = [
        GeneratedFileStub({
          relPath: 'src/if/clean/clean.ts',
          content: 'export const clean = (value: number): number => value + 1;\n',
        }),
        GeneratedFileStub({
          relPath: 'src/if/unused/unused.ts',
          content: 'export const unused = (): number => {\n  const leftover = 1;\n  return 2;\n};\n',
        }),
      ];

      const result = specimensTypecheckBroker({ files });

      expect(result).toStrictEqual([
        { relPath: 'src/if/unused/unused.ts', messages: ["'leftover' is declared but its value is never read."] },
      ]);
    });

    it('INVALID: {a boolean literal compared with false} => returns the no-overlap message', () => {
      specimensTypecheckBrokerProxy();
      const files = [
        GeneratedFileStub({
          relPath: 'src/if/overlap/overlap.ts',
          content:
            "export const overlap = (): string => {\n  const flag = true;\n  if (flag === false) {\n    return 'then';\n  }\n  return 'else';\n};\n",
        }),
      ];

      const result = specimensTypecheckBroker({ files });

      expect(result).toStrictEqual([
        {
          relPath: 'src/if/overlap/overlap.ts',
          messages: [
            "This comparison appears to be unintentional because the types 'true' and 'false' have no overlap.",
          ],
        },
      ]);
    });

    it('EDGE: {two rejected files given out of order, one message twice} => sorts by path and lists each message once', () => {
      specimensTypecheckBrokerProxy();
      const files = [
        GeneratedFileStub({
          relPath: 'src/if/zed/zed.ts',
          content: 'export const zed = (): number => {\n  const leftover = 1;\n  return 2;\n};\n',
        }),
        GeneratedFileStub({
          relPath: 'src/if/alpha/alpha.ts',
          content:
            'export const alpha = (): number => {\n  const leftover = 1;\n  return 1;\n};\nexport const beta = (): number => {\n  const leftover = 2;\n  return 2;\n};\n',
        }),
      ];

      const result = specimensTypecheckBroker({ files });

      expect(result).toStrictEqual([
        { relPath: 'src/if/alpha/alpha.ts', messages: ["'leftover' is declared but its value is never read."] },
        { relPath: 'src/if/zed/zed.ts', messages: ["'leftover' is declared but its value is never read."] },
      ]);
    });
  });
});
