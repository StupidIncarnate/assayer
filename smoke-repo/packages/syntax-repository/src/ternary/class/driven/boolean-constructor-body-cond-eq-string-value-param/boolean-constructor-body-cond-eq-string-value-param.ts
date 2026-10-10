/**
 * Specimen: ternary-boolean-class-constructor-body-cond-eq-string-value-param
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
export class BooleanConstructorBodyCondEqStringValueParam {
    public constructor(value: string) {
        console.log(value === 'xyz' ? 'then' : 'else');
    }
}
