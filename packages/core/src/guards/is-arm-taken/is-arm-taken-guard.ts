/**
 * PURPOSE: Answers whether one case takes a given arm. A case is its list of arm keys, and an arm key
 *   names one branch plus the side taken.
 *
 * USAGE:
 * isArmTakenGuard({ caseKeys: ['f/if:a|then'], target: 'f/if:a|then' });
 * // Returns true
 */
export const isArmTakenGuard = ({
  caseKeys,
  target,
}: {
  caseKeys?: string[] | undefined;
  target?: string | undefined;
}): boolean =>
  caseKeys !== undefined && target !== undefined && caseKeys.includes(target);
