/**
 * Specimen: if-boolean-default-export-cond-not-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: never
 * - if else on line 25: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value: boolean = true;

const booleanCondNotBooleanValueConst = (): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};

export default booleanCondNotBooleanValueConst;
