/**
 * Specimen: ternary-boolean-default-export-cond-not-number-value-param
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
const booleanCondNotNumberValueParam = (value: number): string => {
    return !value ? 'then' : 'else';
};

export default booleanCondNotNumberValueParam;
