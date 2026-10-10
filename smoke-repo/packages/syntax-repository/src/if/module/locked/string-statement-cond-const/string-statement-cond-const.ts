/**
 * Specimen: if-string-module-statement-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 24: driven
 * - if else on line 24: never
 *
 * Expected lint errors:
 * - none
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
const cond: string = 'abc';

if (cond) {
    console.log('then');
}

console.log('else');

export {};
