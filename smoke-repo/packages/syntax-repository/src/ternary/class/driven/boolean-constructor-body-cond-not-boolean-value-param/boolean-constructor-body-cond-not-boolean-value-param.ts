/**
 * Specimen: ternary-boolean-class-constructor-body-cond-not-boolean-value-param
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
export class BooleanConstructorBodyCondNotBooleanValueParam {
    public constructor(value: boolean) {
        console.log(!value ? 'then' : 'else');
    }
}
