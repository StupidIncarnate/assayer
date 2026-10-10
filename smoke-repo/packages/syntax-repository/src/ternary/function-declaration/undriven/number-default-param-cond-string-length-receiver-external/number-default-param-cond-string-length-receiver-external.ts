/**
 * Specimen: ternary-number-function-declaration-default-param-cond-string-length-receiver-external
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
export function numberDefaultParamCondStringLengthReceiverExternal(label: string = (process.argv[2] ?? '').length ? 'then' : 'else'): string {
    return label;
}
