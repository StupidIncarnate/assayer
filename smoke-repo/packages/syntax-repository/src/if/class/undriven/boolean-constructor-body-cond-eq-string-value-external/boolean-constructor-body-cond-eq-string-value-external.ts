/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-string-value-external
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
export class BooleanConstructorBodyCondEqStringValueExternal {
    public constructor() {
        if ((process.argv[2] ?? '') === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
