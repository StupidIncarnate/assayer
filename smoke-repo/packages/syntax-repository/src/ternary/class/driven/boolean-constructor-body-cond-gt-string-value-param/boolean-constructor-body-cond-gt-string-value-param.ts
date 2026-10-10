/**
 * Specimen: ternary-boolean-class-constructor-body-cond-gt-string-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
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
        console.log(value > 'm' ? 'then' : 'else');
    }
}
