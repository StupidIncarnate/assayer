/**
 * Specimen: if-boolean-module-statement-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 23: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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
const value: string = 'abc';

if (value === 'xyz') {
    console.log('then');
}

console.log('else');

export {};
