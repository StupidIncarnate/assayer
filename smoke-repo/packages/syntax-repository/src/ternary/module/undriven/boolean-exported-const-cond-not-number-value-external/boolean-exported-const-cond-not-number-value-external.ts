/**
 * Specimen: ternary-boolean-module-exported-const-cond-not-number-value-external
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
export const booleanExportedConstCondNotNumberValueExternal = !Number(process.argv[2]) ? 'then' : 'else';
