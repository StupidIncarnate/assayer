/**
 * Specimen: ternary-boolean-module-statement-cond-nullish-boolean-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
 * - ternary on line 24: both-ways
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
const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

console.log(value ?? false ? 'then' : 'else');

export {};
