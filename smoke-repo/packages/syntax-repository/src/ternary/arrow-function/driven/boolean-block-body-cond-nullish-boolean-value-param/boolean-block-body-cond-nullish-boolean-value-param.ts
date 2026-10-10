/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-nullish-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
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
export const booleanBlockBodyCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    return value ?? false ? 'then' : 'else';
};
