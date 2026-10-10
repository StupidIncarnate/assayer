/**
 * Specimen: if-boolean-class-constructor-body-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 25: one-way
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 25
 * - line 25
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class BooleanConstructorBodyCondNullishBooleanValueExternal {
    public constructor() {
        if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
            console.log('then');
        }
        console.log('else');
    }
}
