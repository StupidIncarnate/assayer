export const ternaryNumberFunctionExpressionCondNullishNumberValueParam = function (value: number | undefined): string {
    return value ?? 0 ? 'then' : 'else';
};
