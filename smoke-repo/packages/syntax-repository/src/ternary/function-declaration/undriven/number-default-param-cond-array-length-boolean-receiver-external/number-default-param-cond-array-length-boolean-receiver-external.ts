/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-boolean-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 21: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function numberDefaultParamCondArrayLengthBooleanReceiverExternal(label: string = process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else'): string {
    return label;
}
