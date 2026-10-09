export const ifBooleanFunctionExpressionCondGtStringValueParam = function (value: string): string {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
};
