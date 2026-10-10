/**
 * Specimen: ternary-boolean-default-export-cond-gt-number-value-param
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
const booleanCondGtNumberValueParam = (value: number): string => {
    return value > 5 ? 'then' : 'else';
};

export default booleanCondGtNumberValueParam;
