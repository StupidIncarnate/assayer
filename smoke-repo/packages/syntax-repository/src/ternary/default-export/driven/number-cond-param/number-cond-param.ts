/**
 * Specimen: ternary-number-default-export-cond-param
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
const numberCondParam = (cond: number): string => {
    return cond ? 'then' : 'else';
};

export default numberCondParam;
