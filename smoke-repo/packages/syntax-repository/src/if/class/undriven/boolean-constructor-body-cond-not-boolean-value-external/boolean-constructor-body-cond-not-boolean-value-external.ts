/**
 * Specimen: if-boolean-class-constructor-body-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: never
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
        if (!(process.argv[2] === 'yes')) {
            console.log('then');
        }
        console.log('else');
    }
}
