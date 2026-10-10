/**
 * Specimen: ternary-boolean-module-statement-cond-eq-number-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const value = Number(process.env.VALUE);

console.log(value === 7 ? 'then' : 'else');

export {};
