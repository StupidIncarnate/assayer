/**
 * Specimen: if-number-function-declaration-body-cond-string-length-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
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
export function numberBodyCondStringLengthReceiverParam(receiver: string): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
