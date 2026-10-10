/**
 * Specimen: ternary-number-object-literal-property-cond-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 24: both-ways
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
const cond = Number(process.env.COND);

export const numberPropertyCondEnv = {
    label: cond ? 'then' : 'else',
};
