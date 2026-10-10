/**
 * Specimen: ternary-boolean-class-constructor-body-cond-eq-string-value-external
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
export class BooleanConstructorBodyCondEqStringValueExternal {
    public constructor() {
        console.log((process.argv[2] ?? '') === 'xyz' ? 'then' : 'else');
    }
}
