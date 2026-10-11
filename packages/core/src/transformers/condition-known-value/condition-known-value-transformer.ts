/**
 * PURPOSE: Answers the value a branch condition holds when a case runs: `true`, `false`, or `undefined`
 *   when Assayer cannot know. `derive-cases` asks it for a branch no input can steer, so it can tell which
 *   arm the run takes there (the one a known value selects, which is driven) from the arm it cannot take
 *   (which stays an undriven route). `leaf-known-value` answers for each leaf, and decides which leaves
 *   have a known value at all.
 *
 *   `not`, `and` and `or` combine the way JavaScript does, with "not known" spreading only where it
 *   can change the result. `a && b` is `false` whenever either side is `false`, and `a || b` is `true`
 *   whenever either side is `true`, even when the other side is not known.
 *
 * USAGE:
 * conditionKnownValueTransformer({ condition: branch.condition });
 * // Returns true for `!Number(process.argv[2])`, false for `process.argv[2] === 'yes'`, undefined for `!isReady()`
 */
import type { ConditionNode } from '@assayer/shared/contracts';

import { leafKnownValueTransformer } from '../leaf-known-value/leaf-known-value-transformer';

export const conditionKnownValueTransformer = ({ condition }: { condition: ConditionNode }): boolean | undefined => {
  switch (condition.kind) {
    case 'not': {
      const operand = conditionKnownValueTransformer({ condition: condition.operand });

      return operand === undefined ? undefined : !operand;
    }
    case 'and': {
      const left = conditionKnownValueTransformer({ condition: condition.left });
      const right = conditionKnownValueTransformer({ condition: condition.right });

      return left === false || right === false ? false : left === true && right === true ? true : undefined;
    }
    case 'or': {
      const left = conditionKnownValueTransformer({ condition: condition.left });
      const right = conditionKnownValueTransformer({ condition: condition.right });

      return left === true || right === true ? true : left === false && right === false ? false : undefined;
    }
    case 'leaf':
      return leafKnownValueTransformer({ leaf: condition });
    default:
      return undefined;
  }
};
