/**
 * Specimen: ternary-boolean-class-constructor-body-cond-not-number-value-const
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
const value: number = 3;

export class BooleanConstructorBodyCondNotNumberValueConst {
    public constructor() {
        console.log(!value ? 'then' : 'else');
    }
}
