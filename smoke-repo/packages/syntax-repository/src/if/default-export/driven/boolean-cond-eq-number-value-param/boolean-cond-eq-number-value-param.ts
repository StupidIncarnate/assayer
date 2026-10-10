/**
 * Specimen: if-boolean-default-export-cond-eq-number-value-param
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
const booleanCondEqNumberValueParam = (value: number): string => {
    if (value === 7) {
        return 'then';
    }
    return 'else';
};

export default booleanCondEqNumberValueParam;
