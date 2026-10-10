/**
 * Specimen: if-boolean-class-constructor-body-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
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
