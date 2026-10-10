/**
 * Specimen: if-boolean-module-statement-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: one-way
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
    console.log('then');
}

console.log('else');

export {};
