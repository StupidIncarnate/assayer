/**
 * Specimen: if-boolean-default-export-cond-gt-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
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
    if (value > 5) {
        return 'then';
    }
    return 'else';
};

export default booleanCondGtNumberValueParam;
