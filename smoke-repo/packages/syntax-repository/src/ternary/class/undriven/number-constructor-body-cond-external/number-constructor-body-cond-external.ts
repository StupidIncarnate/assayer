/**
 * Specimen: ternary-number-class-constructor-body-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class NumberConstructorBodyCondExternal {
    public constructor() {
        console.log(Number(process.argv[2]) ? 'then' : 'else');
    }
}
