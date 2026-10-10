/**
 * Specimen: ternary-boolean-class-constructor-body-cond-not-boolean-value-external
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
export class BooleanConstructorBodyCondNotBooleanValueExternal {
    public constructor() {
        console.log(!(process.argv[2] === 'yes') ? 'then' : 'else');
    }
}
