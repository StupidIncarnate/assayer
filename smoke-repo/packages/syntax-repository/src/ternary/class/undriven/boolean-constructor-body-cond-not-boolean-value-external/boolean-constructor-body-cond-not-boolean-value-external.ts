/**
 * Specimen: ternary-boolean-class-constructor-body-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export class BooleanConstructorBodyCondNotBooleanValueExternal {
    public constructor() {
        console.log(!(process.argv[2] === 'yes') ? 'then' : 'else');
    }
}
