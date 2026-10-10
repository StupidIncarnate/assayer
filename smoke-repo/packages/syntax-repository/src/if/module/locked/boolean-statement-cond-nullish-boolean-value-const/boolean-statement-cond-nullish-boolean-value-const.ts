/**
 * Specimen: if-boolean-module-statement-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 23: one-way
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
const value: boolean | undefined = true;

if (value ?? false) {
    console.log('then');
}

console.log('else');

export {};
