/**
 * Specimen: if-string-class-constructor-body-cond-external
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
export class StringConstructorBodyCondExternal {
    public constructor() {
        if (process.argv[2] ?? '') {
            console.log('then');
        }
        console.log('else');
    }
}
