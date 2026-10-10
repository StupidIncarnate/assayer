/**
 * Specimen: if-boolean-default-export-cond-nullish-boolean-value-param
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
const booleanCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};

export default booleanCondNullishBooleanValueParam;
