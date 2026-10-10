/**
 * Specimen: ternary-boolean-default-export-cond-eq-boolean-value-param
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
const booleanCondEqBooleanValueParam = (value: boolean): string => {
    return value === false ? 'then' : 'else';
};

export default booleanCondEqBooleanValueParam;
