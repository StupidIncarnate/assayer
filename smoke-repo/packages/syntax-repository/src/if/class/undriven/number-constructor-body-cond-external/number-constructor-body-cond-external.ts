/**
 * Specimen: if-number-class-constructor-body-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: driven
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
export class NumberConstructorBodyCondExternal {
    public constructor() {
        if (Number(process.argv[2])) {
            console.log('then');
        }
        console.log('else');
    }
}
