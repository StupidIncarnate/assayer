/**
 * Specimen: ternary-number-module-exported-const-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export const numberExportedConstCondNullishNumberValueConst = value ?? 0 ? 'then' : 'else';
