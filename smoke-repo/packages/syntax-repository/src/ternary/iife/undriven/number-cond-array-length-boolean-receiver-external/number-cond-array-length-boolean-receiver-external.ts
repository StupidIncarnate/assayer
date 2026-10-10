/**
 * Specimen: ternary-number-iife-cond-array-length-boolean-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 22
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const numberCondArrayLengthBooleanReceiverExternal = ((): string => {
    return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
})();
