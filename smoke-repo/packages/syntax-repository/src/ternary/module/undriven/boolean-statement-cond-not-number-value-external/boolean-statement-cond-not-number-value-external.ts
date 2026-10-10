/**
 * Specimen: ternary-boolean-module-statement-cond-not-number-value-external
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
console.log(!Number(process.argv[2]) ? 'then' : 'else');

export {};
