/**
 * Specimen: ternary-boolean-default-export-cond-nullish-boolean-value-param
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
const booleanCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    return value ?? false ? 'then' : 'else';
};

export default booleanCondNullishBooleanValueParam;
