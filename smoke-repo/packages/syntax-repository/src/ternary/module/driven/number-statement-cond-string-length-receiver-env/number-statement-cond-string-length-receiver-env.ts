/**
 * Specimen: ternary-number-module-statement-cond-string-length-receiver-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
const receiver = process.env.RECEIVER ?? '';

console.log(receiver.length ? 'then' : 'else');

export {};
