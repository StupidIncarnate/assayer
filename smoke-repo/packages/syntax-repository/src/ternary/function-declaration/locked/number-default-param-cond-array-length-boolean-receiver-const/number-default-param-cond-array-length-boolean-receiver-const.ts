/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-boolean-receiver-const
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
const receiver: readonly boolean[] = [true, false, true];

export function numberDefaultParamCondArrayLengthBooleanReceiverConst(label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
