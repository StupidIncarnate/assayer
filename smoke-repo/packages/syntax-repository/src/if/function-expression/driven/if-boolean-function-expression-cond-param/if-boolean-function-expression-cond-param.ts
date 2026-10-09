export const ifBooleanFunctionExpressionCondParam = function (cond: boolean): string {
    if (cond) {
        return 'then';
    }
    return 'else';
};
