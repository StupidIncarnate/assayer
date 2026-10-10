/**
 * Specimen: ternary-number-class-constructor-body-cond-param
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
export class NumberConstructorBodyCondParam {
    public constructor(cond: number) {
        console.log(cond ? 'then' : 'else');
    }
}
