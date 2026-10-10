/**
 * Specimen: if-number-class-constructor-body-cond-param
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
export class NumberConstructorBodyCondParam {
    public constructor(cond: number) {
        if (cond) {
            console.log('then');
        }
        console.log('else');
    }
}
