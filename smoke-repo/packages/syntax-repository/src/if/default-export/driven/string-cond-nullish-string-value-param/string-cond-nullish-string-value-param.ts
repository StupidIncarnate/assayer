/**
 * Specimen: if-string-default-export-cond-nullish-string-value-param
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
const stringCondNullishStringValueParam = (value: string | undefined): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};

export default stringCondNullishStringValueParam;
