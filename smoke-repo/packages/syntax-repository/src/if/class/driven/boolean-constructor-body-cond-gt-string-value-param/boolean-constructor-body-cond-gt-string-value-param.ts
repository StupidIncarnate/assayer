/**
 * Specimen: if-boolean-class-constructor-body-cond-gt-string-value-param
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
export class BooleanConstructorBodyCondGtStringValueParam {
    public constructor(value: string) {
        if (value > 'm') {
            console.log('then');
        }
        console.log('else');
    }
}
