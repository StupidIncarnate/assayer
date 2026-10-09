export const ifStringFunctionExpressionCondNullishStringValueParam = function (value: string | undefined): string {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};
