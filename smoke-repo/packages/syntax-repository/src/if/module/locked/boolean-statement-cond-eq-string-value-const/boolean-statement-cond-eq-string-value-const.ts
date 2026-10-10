/**
 * Specimen: if-boolean-module-statement-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 25
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value: string = 'abc';

if (value === 'xyz') {
    console.log('then');
}

console.log('else');

export {};
