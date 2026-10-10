/**
 * Specimen: ternary-boolean-class-constructor-body-cond-gt-number-value-param
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
export class BooleanConstructorBodyCondGtNumberValueParam {
    public constructor(value: number) {
        console.log(value > 5 ? 'then' : 'else');
    }
}
