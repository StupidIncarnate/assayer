/**
 * Specimen: ternary-boolean-class-constructor-body-cond-not-number-value-external
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
export class BooleanConstructorBodyCondNotNumberValueExternal {
    public constructor() {
        console.log(!Number(process.argv[2]) ? 'then' : 'else');
    }
}
