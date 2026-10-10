/**
 * Specimen: ternary-string-class-constructor-body-cond-param
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
export class StringConstructorBodyCondParam {
    public constructor(cond: string) {
        console.log(cond ? 'then' : 'else');
    }
}
