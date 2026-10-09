export const ternaryStringFunctionExpressionCondNullishStringValueParam = function (value: string | undefined): string {
    return value ?? '' ? 'then' : 'else';
};
