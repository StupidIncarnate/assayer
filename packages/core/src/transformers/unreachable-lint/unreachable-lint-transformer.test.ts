import { constLengthContract, lineNumberContract, representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';

import { unreachableLintTransformer } from './unreachable-lint-transformer';

const name = symbolNameContract.parse('classify');
const line = (value: number): ReturnType<typeof lineNumberContract.parse> => lineNumberContract.parse(value);

describe('unreachableLintTransformer', () => {
  describe('contradictory guards', () => {
    // No welded operand: the exit is dead because its guards conflict. The message names the guard
    // lines and pluralizes correctly.
    it('VALID: {two contradictory guards} => a lint naming both guard lines', () => {
      expect(
        unreachableLintTransformer({
          name,
          displayName: name,
          unreachableExits: [{ line: line(10), guardLines: [line(2), line(6)] }],
        }),
      ).toStrictEqual([
        {
          rule: 'unreachable-exit',
          name: 'classify',
          message:
            '`classify` can never reach the exit on line 10: the guards on lines 2, 6 cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.',
          startLine: 10,
          endLine: 10,
        },
      ]);
    });

    it('VALID: {a single guard line} => the message reads "line" not "lines"', () => {
      const [lint] = unreachableLintTransformer({ name, displayName: name, unreachableExits: [{ line: line(9), guardLines: [line(3)] }] });

      expect(String(lint?.message)).toBe(
        '`classify` can never reach the exit on line 9: the guards on line 3 cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.',
      );
    });
  });

  describe('a welded scalar constant', () => {
    // A single always-true guard: the message names the operand and its welded value, NOT "the guards
    // cannot all hold at once" (which is false — the one guard always holds). The displayName is the
    // module label, so the reader never sees the internal `*module*`.
    it('VALID: {level welded to 7} => a lint naming the operand, the value, and the branch line', () => {
      const [lint] = unreachableLintTransformer({
        name: symbolNameContract.parse('*module*'),
        displayName: symbolNameContract.parse('welded-const.ts'),
        unreachableExits: [
          {
            line: line(6),
            guardLines: [line(3)],
            welded: { line: line(3), operand: symbolNameContract.parse('level'), value: representativeValueContract.parse(7) },
          },
        ],
      });

      expect(lint).toStrictEqual({
        rule: 'unreachable-exit',
        name: '*module*',
        message:
          '`welded-const.ts` can never reach the exit on line 6: `level` is welded to `7`, so the branch on line 3 always takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
        startLine: 6,
        endLine: 6,
      });
    });
  });

  describe('a welded array constant', () => {
    // The array twin: the operand is welded to a fixed LENGTH rather than a scalar value.
    it('VALID: {items welded to a fixed length of 3} => a lint naming the operand and its length', () => {
      const [lint] = unreachableLintTransformer({
        name: symbolNameContract.parse('*module*'),
        displayName: symbolNameContract.parse('const-array-branch.ts'),
        unreachableExits: [
          {
            line: line(6),
            guardLines: [line(3)],
            welded: { line: line(3), operand: symbolNameContract.parse('items'), length: constLengthContract.parse(3) },
          },
        ],
      });

      expect(String(lint?.message)).toBe(
        '`const-array-branch.ts` can never reach the exit on line 6: `items` is welded to a fixed length of 3, so the branch on line 3 always takes its other arm and this one is dead. Either a comparison is wrong, or this arm should be deleted.',
      );
    });
  });
});
