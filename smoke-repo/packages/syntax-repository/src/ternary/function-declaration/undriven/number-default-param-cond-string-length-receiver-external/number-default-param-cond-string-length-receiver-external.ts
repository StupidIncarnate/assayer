/**
 * Specimen: ternary-number-function-declaration-default-param-cond-string-length-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: never
 * - ternary else on line 22: never
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
export function numberDefaultParamCondStringLengthReceiverExternal(label: string = (process.argv[2] ?? '').length ? 'then' : 'else'): string {
    return label;
}
