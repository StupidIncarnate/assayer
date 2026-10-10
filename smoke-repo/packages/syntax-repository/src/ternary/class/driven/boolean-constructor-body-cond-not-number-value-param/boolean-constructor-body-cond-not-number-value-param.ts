/**
 * Specimen: ternary-boolean-class-constructor-body-cond-not-number-value-param
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
export class BooleanConstructorBodyCondNotNumberValueParam {
    public constructor(value: number) {
        console.log(!value ? 'then' : 'else');
    }
}
