/**
 * Specimen: if-boolean-default-export-cond-eq-boolean-value-param
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
const booleanCondEqBooleanValueParam = (value: boolean): string => {
    if (value === false) {
        return 'then';
    }
    return 'else';
};

export default booleanCondEqBooleanValueParam;
