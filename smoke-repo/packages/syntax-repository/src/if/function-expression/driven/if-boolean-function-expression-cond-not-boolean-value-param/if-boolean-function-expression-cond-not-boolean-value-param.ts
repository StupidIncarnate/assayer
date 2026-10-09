export const ifBooleanFunctionExpressionCondNotBooleanValueParam = function (value: boolean): string {
    if (!value) {
        return 'then';
    }
    return 'else';
};
