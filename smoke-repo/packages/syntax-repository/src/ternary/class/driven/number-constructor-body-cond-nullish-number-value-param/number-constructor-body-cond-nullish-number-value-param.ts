/**
 * Specimen: ternary-number-class-constructor-body-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
export class NumberConstructorBodyCondNullishNumberValueParam {
    public constructor(value: number | undefined) {
        console.log(value ?? 0 ? 'then' : 'else');
    }
}
