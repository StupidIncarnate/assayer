/**
 * Specimen: if-number-module-statement-cond-nullish-number-value-const
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
const value: number | undefined = 3;

if (value ?? 0) {
    console.log('then');
}

console.log('else');

export {};
