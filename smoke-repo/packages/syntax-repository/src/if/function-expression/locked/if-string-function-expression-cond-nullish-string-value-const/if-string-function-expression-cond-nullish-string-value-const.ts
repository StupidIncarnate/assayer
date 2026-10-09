const value: string | undefined = 'abc';

export const ifStringFunctionExpressionCondNullishStringValueConst = function (): string {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};
