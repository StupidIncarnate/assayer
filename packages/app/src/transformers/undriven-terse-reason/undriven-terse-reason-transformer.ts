/**
 * PURPOSE: Extracts a concise, human-readable reason from an UndrivenEntry's reason text for display
 *   in the detail panel's Undriven Errors section. Condenses long paragraphs into a single terse sentence
 *   explaining why the runner could not steer the branch or entry.
 *
 * USAGE:
 * undrivenTerseReasonTransformer({ reason: '`fn` has a branch on line 3 whose deciding value `x` is neither…' });
 * // Returns 'Deciding value `x` is not a parameter or env var'
 */
export const undrivenTerseReasonTransformer = ({ reason }: { reason: string }): string => {
  const operandMatch = /whose deciding value `([^`]+)` is neither/u.exec(reason);
  if (operandMatch?.[1] !== undefined) {
    return `Deciding value \`${operandMatch[1]}\` is not a parameter or env var`;
  }

  if (reason.includes('whose deciding value is neither one of its parameters nor an environment variable')) {
    return 'Condition has no parameter or env var to steer it';
  }

  const literalMatch = /compares `([^`]+)` against a value Assayer could not read as a literal/u.exec(reason);
  if (literalMatch?.[1] !== undefined) {
    return `Compares \`${literalMatch[1]}\` against unreadable non-literal`;
  }

  if (reason.includes('whose deciding value is a `typeof` read')) {
    return 'Deciding value is an unarrangeable typeof read';
  }

  const typeofMemberMatch = /reads `typeof ([^`]+)`/u.exec(reason);
  if (typeofMemberMatch?.[1] !== undefined) {
    return `Narrows typeof \`${typeofMemberMatch[1]}\` to an unfillable union shape`;
  }

  if (reason.includes('it runs at import time')) {
    return 'Runs at import time (no entry parameters)';
  }

  if (reason.includes('private and no reachable surface calls it')) {
    return 'Private helper not called by any reachable entry';
  }

  if (reason.includes('constructor')) {
    return 'Instance method requires constructor arguments';
  }

  const [firstSentence] = reason.split(/[,:.]/u);
  return firstSentence !== undefined && firstSentence.trim().length > 0
    ? firstSentence.trim()
    : 'Not reachable by test runner';
};
