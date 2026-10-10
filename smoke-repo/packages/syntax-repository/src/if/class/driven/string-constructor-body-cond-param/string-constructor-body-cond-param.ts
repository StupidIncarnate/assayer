/**
 * Specimen: if-string-class-constructor-body-cond-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class StringConstructorBodyCondParam {
    public constructor(cond: string) {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
