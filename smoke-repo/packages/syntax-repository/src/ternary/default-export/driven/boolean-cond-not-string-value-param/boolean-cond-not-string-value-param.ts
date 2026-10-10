/**
 * Specimen: ternary-boolean-default-export-cond-not-string-value-param
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
const booleanCondNotStringValueParam = (value: string): string => {
    return !value ? 'then' : 'else';
};

export default booleanCondNotStringValueParam;
