/**
 * Specimen: ternary-number-default-export-cond-nullish-number-value-param
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
const numberCondNullishNumberValueParam = (value: number | undefined): string => {
    return value ?? 0 ? 'then' : 'else';
};

export default numberCondNullishNumberValueParam;
