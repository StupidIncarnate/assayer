export const ifBooleanFunctionExpressionCondEqBooleanValueParam = function (value: boolean): string {
    if (value === false) {
        return 'then';
    }
    return 'else';
};
