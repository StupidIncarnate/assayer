/**
 * Specimen: ternary-number-module-statement-cond-array-length-boolean-receiver-external
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
console.log(process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else');

export {};
