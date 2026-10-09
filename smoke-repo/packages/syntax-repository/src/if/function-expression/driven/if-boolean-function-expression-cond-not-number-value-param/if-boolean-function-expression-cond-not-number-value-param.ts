export const ifBooleanFunctionExpressionCondNotNumberValueParam = function (value: number): string {
    if (!value) {
        return 'then';
    }
    return 'else';
};
