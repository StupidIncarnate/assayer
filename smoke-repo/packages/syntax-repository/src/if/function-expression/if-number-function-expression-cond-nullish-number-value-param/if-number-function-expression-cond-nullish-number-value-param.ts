export const ifNumberFunctionExpressionCondNullishNumberValueParam = function (value: number | undefined): string {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
};
