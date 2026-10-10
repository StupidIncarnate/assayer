/**
 * Specimen: if-boolean-class-constructor-body-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: driven
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
export class BooleanConstructorBodyCondNotNumberValueExternal {
    public constructor() {
        if (!Number(process.argv[2])) {
            console.log('then');
        }
        console.log('else');
    }
}
