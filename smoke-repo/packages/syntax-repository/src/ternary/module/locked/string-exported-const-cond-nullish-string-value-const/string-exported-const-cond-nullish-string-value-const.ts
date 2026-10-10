/**
 * Specimen: ternary-string-module-exported-const-cond-nullish-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 24
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value: string | undefined = 'abc';

export const stringExportedConstCondNullishStringValueConst = value ?? '' ? 'then' : 'else';
