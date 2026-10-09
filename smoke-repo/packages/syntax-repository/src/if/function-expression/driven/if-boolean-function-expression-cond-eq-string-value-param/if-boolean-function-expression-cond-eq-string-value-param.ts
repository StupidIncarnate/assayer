export const ifBooleanFunctionExpressionCondEqStringValueParam = function (value: string): string {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};
