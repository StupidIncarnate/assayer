/**
 * Specimen: if-boolean-default-export-cond-eq-string-value-param
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
const booleanCondEqStringValueParam = (value: string): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};

export default booleanCondEqStringValueParam;
