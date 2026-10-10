/**
 * Specimen: ternary-boolean-class-constructor-body-cond-param
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
export class BooleanConstructorBodyCondParam {
    public constructor(cond: boolean) {
        console.log(cond ? 'then' : 'else');
    }
}
