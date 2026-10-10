/**
 * Specimen: ternary-number-function-declaration-default-param-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 21: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function numberDefaultParamCondNullishNumberValueParam(value: number | undefined, label: string = value ?? 0 ? 'then' : 'else'): string {
    return label;
}
