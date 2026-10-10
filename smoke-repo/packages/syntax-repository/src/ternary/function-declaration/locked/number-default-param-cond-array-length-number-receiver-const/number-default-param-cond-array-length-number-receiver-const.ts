/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-number-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 24
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

export function numberDefaultParamCondArrayLengthNumberReceiverConst(label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
