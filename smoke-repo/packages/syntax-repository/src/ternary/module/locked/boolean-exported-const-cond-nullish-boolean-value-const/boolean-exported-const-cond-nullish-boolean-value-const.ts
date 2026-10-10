/**
 * Specimen: ternary-boolean-module-exported-const-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export const booleanExportedConstCondNullishBooleanValueConst = value ?? false ? 'then' : 'else';
