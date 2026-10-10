/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-nullish-boolean-value-param
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
export function booleanDefaultParamCondNullishBooleanValueParam(value: boolean | undefined, label: string = value ?? false ? 'then' : 'else'): string {
    return label;
}
