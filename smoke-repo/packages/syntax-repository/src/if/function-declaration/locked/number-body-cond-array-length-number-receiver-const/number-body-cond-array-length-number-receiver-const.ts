/**
 * Specimen: if-number-function-declaration-body-cond-array-length-number-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 28
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

export function numberBodyCondArrayLengthNumberReceiverConst(): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
