/**
 * Specimen: ternary-number-arrow-function-block-body-cond-array-length-number-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: never
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
const receiver: readonly number[] = [10, 20, 30];

export const numberBlockBodyCondArrayLengthNumberReceiverConst = (): string => {
    return receiver.length ? 'then' : 'else';
};
