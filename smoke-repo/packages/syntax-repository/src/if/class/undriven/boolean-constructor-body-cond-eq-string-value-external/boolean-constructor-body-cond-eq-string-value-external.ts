/**
 * Specimen: if-boolean-class-constructor-body-cond-eq-string-value-external
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
export class BooleanConstructorBodyCondEqStringValueExternal {
    public constructor() {
        if ((process.argv[2] ?? '') === 'xyz') {
            console.log('then');
        }
        console.log('else');
    }
}
