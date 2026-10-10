/**
 * Specimen: if-string-class-constructor-body-cond-nullish-string-value-param
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
export class StringConstructorBodyCondNullishStringValueParam {
    public constructor(value: string | undefined) {
        if (value ?? '') {
            console.log('then');
        }
        console.log('else');
    }
}
