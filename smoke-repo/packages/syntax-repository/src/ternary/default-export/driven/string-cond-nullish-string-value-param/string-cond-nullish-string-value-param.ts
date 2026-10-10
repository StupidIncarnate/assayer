/**
 * Specimen: ternary-string-default-export-cond-nullish-string-value-param
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
const stringCondNullishStringValueParam = (value: string | undefined): string => {
    return value ?? '' ? 'then' : 'else';
};

export default stringCondNullishStringValueParam;
