/**
 * Specimen: ternary-boolean-class-constructor-body-cond-nullish-boolean-value-param
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
export class BooleanConstructorBodyCondNullishBooleanValueParam {
    public constructor(value: boolean | undefined) {
        console.log(value ?? false ? 'then' : 'else');
    }
}
