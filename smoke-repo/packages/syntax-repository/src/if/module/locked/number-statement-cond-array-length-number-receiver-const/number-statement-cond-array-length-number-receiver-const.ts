/**
 * Specimen: if-number-module-statement-cond-array-length-number-receiver-const
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
const receiver: readonly number[] = [10, 20, 30];

if (receiver.length) {
    console.log('then');
}

console.log('else');

export {};
