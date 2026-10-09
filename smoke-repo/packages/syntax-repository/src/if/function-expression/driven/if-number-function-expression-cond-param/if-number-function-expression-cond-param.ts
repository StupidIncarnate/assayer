export const ifNumberFunctionExpressionCondParam = function (cond: number): string {
    if (cond) {
        return 'then';
    }
    return 'else';
};
