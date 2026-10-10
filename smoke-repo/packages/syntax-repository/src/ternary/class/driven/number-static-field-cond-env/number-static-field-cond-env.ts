/**
 * Specimen: ternary-number-class-static-field-cond-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const cond = Number(process.env.COND);

export class NumberStaticFieldCondEnv {
    public static label = cond ? 'then' : 'else';
}
