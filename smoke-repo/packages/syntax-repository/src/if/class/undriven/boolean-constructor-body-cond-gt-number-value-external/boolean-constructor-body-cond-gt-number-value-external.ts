/**
 * Specimen: if-boolean-class-constructor-body-cond-gt-number-value-external
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
export class BooleanConstructorBodyCondGtNumberValueExternal {
    public constructor() {
        if (Number(process.argv[2]) > 5) {
            console.log('then');
        }
        console.log('else');
    }
}
