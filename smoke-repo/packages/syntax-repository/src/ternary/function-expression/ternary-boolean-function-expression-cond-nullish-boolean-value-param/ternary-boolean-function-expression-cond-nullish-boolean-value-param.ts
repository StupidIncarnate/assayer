export const ternaryBooleanFunctionExpressionCondNullishBooleanValueParam = function (value: boolean | undefined): string {
    return value ?? false ? 'then' : 'else';
};
