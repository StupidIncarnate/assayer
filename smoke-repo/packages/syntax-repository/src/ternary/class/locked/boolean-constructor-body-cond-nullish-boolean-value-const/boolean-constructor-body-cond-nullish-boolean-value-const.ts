/**
 * Specimen: ternary-boolean-class-constructor-body-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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
const value: boolean | undefined = true;

export class BooleanConstructorBodyCondNullishBooleanValueConst {
    public constructor() {
        console.log(value ?? false ? 'then' : 'else');
    }
}
