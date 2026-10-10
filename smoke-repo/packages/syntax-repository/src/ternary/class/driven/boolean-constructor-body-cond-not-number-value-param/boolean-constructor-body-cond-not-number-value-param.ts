/**
 * Specimen: ternary-boolean-class-constructor-body-cond-not-number-value-param
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
export class BooleanConstructorBodyCondNotNumberValueParam {
    public constructor(value: number) {
        console.log(!value ? 'then' : 'else');
    }
}
