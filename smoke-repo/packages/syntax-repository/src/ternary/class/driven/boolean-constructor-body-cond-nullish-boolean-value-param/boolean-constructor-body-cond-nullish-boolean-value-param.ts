/**
 * Specimen: ternary-boolean-class-constructor-body-cond-nullish-boolean-value-param
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
export class BooleanConstructorBodyCondNullishBooleanValueParam {
    public constructor(value: boolean | undefined) {
        console.log(value ?? false ? 'then' : 'else');
    }
}
