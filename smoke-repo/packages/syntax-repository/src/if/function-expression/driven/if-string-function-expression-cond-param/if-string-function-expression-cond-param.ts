export const ifStringFunctionExpressionCondParam = function (cond: string): string {
    if (cond) {
        return 'then';
    }
    return 'else';
};
