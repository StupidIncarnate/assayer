/**
 * Specimen: ternary-boolean-module-statement-cond-eq-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 21: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
console.log(Number(process.argv[2]) === 7 ? 'then' : 'else');

export {};
