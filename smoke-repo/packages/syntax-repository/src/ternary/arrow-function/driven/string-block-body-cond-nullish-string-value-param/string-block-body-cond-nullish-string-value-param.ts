/**
 * Specimen: ternary-string-arrow-function-block-body-cond-nullish-string-value-param
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
export const stringBlockBodyCondNullishStringValueParam = (value: string | undefined): string => {
    return value ?? '' ? 'then' : 'else';
};
