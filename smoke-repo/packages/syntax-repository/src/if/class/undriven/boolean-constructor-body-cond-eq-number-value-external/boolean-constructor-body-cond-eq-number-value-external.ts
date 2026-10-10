/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-number-value-external
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
export class BooleanConstructorBodyCondEqNumberValueExternal {
    public constructor() {
        if (Number(process.argv[2]) === 7) {
            console.log('then');
        }
        console.log('else');
    }
}
