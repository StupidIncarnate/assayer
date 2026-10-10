/**
 * Specimen: ternary-boolean-module-exported-const-cond-eq-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: never
 * - ternary else on line 22: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 22
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanExportedConstCondEqStringValueExternal = (process.argv[2] ?? '') === 'xyz' ? 'then' : 'else';
