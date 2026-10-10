/**
 * Specimen: ternary-boolean-module-statement-cond-eq-boolean-value-external
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
console.log(process.argv[2] === 'yes' === false ? 'then' : 'else');

export {};
