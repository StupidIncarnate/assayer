export const ifBooleanFunctionExpressionCondNullishBooleanValueParam = function (value: boolean | undefined): string {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};
