/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-gt-string-value-param
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
export const booleanBlockBodyCondGtStringValueParam = (value: string): string => {
    return value > 'm' ? 'then' : 'else';
};
